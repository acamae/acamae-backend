import bcrypt from 'bcryptjs';
import FormData from 'form-data';
import Mailgun from 'mailgun.js'; // eslint-disable-line import/no-unresolved
import { v4 as uuidv4 } from 'uuid';

import { config } from '../../infrastructure/config/environment.js';
import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../shared/constants/appRoutes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { REGEX, USER_ROLES } from '../../shared/constants/validation.js';
import { createError } from '../../shared/utils/error.js';
import { sanitizeString } from '../../shared/utils/sanitize.js';
import { TokenService } from '../../shared/utils/token.js';

// Removed direct Prisma usage; interactions go through repositories

/**
 * Authentication service
 */
export class AuthService {
  /**
   * @param {UserRepository} userRepository
   * @param {SessionTokenRepository} sessionTokenRepository
   */
  constructor(userRepository, sessionTokenRepository) {
    this.userRepository = userRepository;
    this.sessionTokenRepository = sessionTokenRepository;
    this.SALT_ROUNDS = 10;
    this.tokenService = new TokenService();
    // Compute verification token TTL
    const rawExpiration = process.env.VERIFICATION_EXPIRATION || '10m';
    this.VERIFICATION_EXPIRATION_MS = this.parseDuration(rawExpiration);
    this.REFRESH_EXPIRES_MS = this.parseDuration(config.jwt.refreshExpiresIn);
  }

  /**
   * Convierte strings tipo '7d', '24h', '30m', '60s' o milisegundos a ms.
   * @param {string|number} value
   * @returns {number}
   */
  parseDuration(value) {
    if (typeof value === 'number') return value;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    const regex = /^(\d+)([smhd])$/; // segundos, minutos, horas, días
    const match = value.match(regex);
    if (!match) return 0;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
    return num * unitMs;
  }

  /**
   * Register a new user
   * @param {CreateUserDto} userData
   * @returns {Promise<User>}
   */
  async register(userData) {
    const { email, password, username } = userData;

    // Check duplicates via repository
    const [existingByEmail, existingByUsername] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByUsername(username),
    ]);

    if (existingByEmail || existingByUsername) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS],
        API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS
      );
    }

    const verificationToken = uuidv4();
    const verificationExpiresAt = new Date(Date.now() + this.VERIFICATION_EXPIRATION_MS);

    const createdUser = await this.userRepository.create({
      email,
      username,
      password,
      role: USER_ROLES.USER,
      verificationToken,
      verificationExpiresAt,
    });

    // Send verification email
    await this.sendVerificationEmail(createdUser.email, verificationToken);

    // Exclude passwordHash before return
    const { passwordHash, ...user } = createdUser;
    return user;
  }

  /**
   * Verify the email of a user
   * @param {string} token
   * @returns {Promise<boolean>}
   */
  async verifyEmail(token) {
    const sanitizedToken = sanitizeString(token);

    if (!REGEX.UUID_V4.test(sanitizedToken)) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }

    // Use sanitized token from now on
    const user = await this.userRepository.findByVerificationToken(sanitizedToken);

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }

    if (user.isVerified) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED],
        API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED
      );
    }

    // Check token expiration
    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_EXPIRED],
        API_ERROR_CODES.AUTH_TOKEN_EXPIRED
      );
    }

    // Mark as verified
    await this.userRepository.setVerified(user.id, true);

    return true;
  }

  /**
   * Start user login
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
   */
  async login(email, password) {
    const dbUser = await this.userRepository.findByEmail(email);

    if (!dbUser) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        API_ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash);
    if (!isValidPassword) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        API_ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    if (!dbUser.isVerified) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.EMAIL_NOT_VERIFIED],
        API_ERROR_CODES.EMAIL_NOT_VERIFIED
      );
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      is_verified: dbUser.isVerified,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };

    const tokens = this.tokenService.generateTokens({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    });

    // Save refreshToken in session_tokens
    try {
      await this.sessionTokenRepository.create({
        userId: dbUser.id,
        token: tokens.refreshToken,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + this.REFRESH_EXPIRES_MS),
      });
    } catch (err) {
      console.error(ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN_ERROR], err);
    }

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Get current user information
   * @param {string} userId
   * @returns {Promise<User>}
   */
  async getMe(userId) {
    const dbUser = await this.userRepository.findById(userId);

    if (!dbUser) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        API_ERROR_CODES.AUTH_USER_NOT_FOUND
      );
    }

    const { passwordHash, ...user } = dbUser;
    return user;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshToken(refreshToken) {
    try {
      // Check if refreshToken exists in session_tokens
      const sessionToken = await this.sessionTokenRepository.findByToken(refreshToken);
      if (!sessionToken) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
          API_ERROR_CODES.INVALID_REFRESH_TOKEN
        );
      }

      if (sessionToken.expiresAt < new Date()) {
        // Token expired -> delete record and throw error
        await this.sessionTokenRepository.deleteById(sessionToken.id);
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_EXPIRED],
          API_ERROR_CODES.AUTH_TOKEN_EXPIRED
        );
      }

      // Update last activity
      await this.sessionTokenRepository.update(sessionToken.id, { lastActivityAt: new Date() });

      // Verify refresh token signature and get payload
      const payload = this.tokenService.verifyRefreshToken(refreshToken);

      // Get user to include updated data (in case the role changed)
      const dbUser = await this.userRepository.findById(payload.userId);

      if (!dbUser) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
          API_ERROR_CODES.AUTH_USER_NOT_FOUND
        );
      }

      // Generate new tokens and replace refresh in DB
      const newTokens = this.tokenService.generateTokens({
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      });

      // Sustituir token en la tabla session_tokens
      await this.sessionTokenRepository.update(sessionToken.id, {
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + this.REFRESH_EXPIRES_MS),
      });

      return newTokens;
    } catch (_error) {
      console.error('Error refreshing token:', _error);
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
        API_ERROR_CODES.INVALID_REFRESH_TOKEN
      );
    }
  }

  /**
   * @TODO: Implementar logout
   * Logout user
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    // Attempt to delete the session token
    const count = await this.sessionTokenRepository.deleteByToken(refreshToken);

    if (count === 0) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
        API_ERROR_CODES.INVALID_REFRESH_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    return true;
  }

  /**
   * Start the password reset process
   * @param {string} email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        API_ERROR_CODES.AUTH_USER_NOT_FOUND
      );
    }

    const resetToken = uuidv4();
    await this.userRepository.setResetToken(
      user.id,
      resetToken,
      new Date(Date.now() + this.parseDuration('1h'))
    );

    // @TODO: Send email with the reset token
    console.log('Reset token:', resetToken);
  }

  /**
   * Reset user password
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   */
  async resetPassword(token, newPassword) {
    const user = await this.userRepository.findByResetToken(token);

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_RESET_TOKEN],
        API_ERROR_CODES.INVALID_RESET_TOKEN
      );
    }

    await this.userRepository.update(user.id, {
      password: newPassword,
      resetToken: null,
      resetExpiresAt: null,
    });

    return true;
  }

  /**
   * Send verification email using Mailgun
   * @param {string} email
   * @param {string} token
   */
  async sendVerificationEmail(email, token) {
    if (!config.mail?.mailgun) {
      console.log(`Verification email for ${email}: ${token}`);
      return;
    }

    try {
      const mailgun = new Mailgun(FormData);
      const mg = mailgun.client({
        username: 'api',
        key: config.mail.mailgun.apiKey,
        url: config.mail.mailgun.endpoint, // 'https://api.eu.mailgun.net' for EU domains
      });

      const verifyUrl = `${config.cors.frontendUrl}${APP_ROUTES.VERIFY_EMAIL}?token=${token}`;

      const response = await mg.messages.create(config.mail.mailgun.domain, {
        from: config.mail.mailgun.from,
        to: email,
        subject: 'Verify your email',
        template: 'verify your email',
        'h:X-Mailgun-Variables': JSON.stringify({
          verify_url: verifyUrl,
        }),
      });
      return true;
    } catch (err) {
      console.error(ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN_ERROR], err);
      // Do not throw error to not interrupt the registration process
      return false;
    }
  }
}
