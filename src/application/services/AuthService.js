import bcrypt from 'bcryptjs';
import FormData from 'form-data';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
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
    const verificationExpiresAt = new Date(Date.now() + config.tokens.verificationExpiration);

    const createdUser = await this.userRepository.create({
      email,
      username,
      password,
      role: USER_ROLES.USER,
      verificationToken,
      verificationExpiresAt,
    });

    // Enviar email de verificación
    let emailSent = false;
    let emailError = null;

    try {
      await this.sendVerificationEmail(createdUser.email, createdUser.username, verificationToken);
      emailSent = true;
    } catch (error) {
      emailError = error.message;
      console.error('Error enviando email de verificación:', error);
    }

    // Exclude passwordHash before return
    const { passwordHash, ...user } = createdUser;

    return {
      user,
      emailSent,
      emailError,
    };
  }

  /**
   * Verify the email of a user
   * @param {string} token
   * @returns {Promise<{status: string, message: string, resendRequired: boolean}>}
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
      const error = createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID
      );
      error.customResponse = {
        status: 'AUTH_TOKEN_INVALID',
        message: 'Invalid verification token',
        resendRequired: true,
      };
      throw error;
    }

    if (user.isVerified) {
      const error = createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED],
        API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED
      );
      error.customResponse = {
        status: 'AUTH_USER_ALREADY_VERIFIED',
        message: 'Email is already verified',
        resendRequired: false,
      };
      throw error;
    }

    // Check token expiration
    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      const error = createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_EXPIRED],
        API_ERROR_CODES.AUTH_TOKEN_EXPIRED
      );
      error.customResponse = {
        status: 'AUTH_TOKEN_EXPIRED',
        message: 'Verification token has expired',
        resendRequired: true,
      };
      throw error;
    }
    // Mark as verified
    try {
      await this.userRepository.setVerified(user.id, true);
      return {
        status: 'SUCCESS',
        message: 'Email verified successfully',
        resendRequired: false,
      };
    } catch {
      const error = createError(
        'Token is valid but user update failed',
        API_ERROR_CODES.DATABASE_ERROR
      );
      error.customResponse = {
        status: 'update_failed',
        message: 'Token is valid but user update failed',
        resendRequired: true,
      };
      throw error;
    }
  }

  /**
   * Start user login
   * @param {string} email
   * @param {string} password
   * @param {string} [ipAddress] - User's IP address for tracking
   * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
   */
  async login(email, password, ipAddress = null) {
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

    // NEW: Update last login tracking
    try {
      await this.userRepository.updateLoginTracking(dbUser.id, new Date(), ipAddress);
    } catch (error) {
      console.warn('Failed to update login tracking:', error.message);
      // Don't fail the login if tracking update fails
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      is_verified: dbUser.isVerified,
      is_active: dbUser.isActive, // NEW: Include active status
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
        expiresAt: new Date(Date.now() + config.tokens.refreshExpiration),
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
        expiresAt: new Date(Date.now() + config.tokens.refreshExpiration),
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
      new Date(Date.now() + config.tokens.passwordResetExpiration)
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
  async sendVerificationEmail(email, username, token) {
    if (!config.mail) {
      console.log(`Email not configured - Token for ${username} (${email}): ${token}`);
      throw new Error(
        'Email service not configured. Please configure MAIL_API_KEY or MAIL_HOST environment variables.'
      );
    }

    const mailerSend = new MailerSend({
      apiKey: config.mail.apiKey,
    });
    const personalization = [
      {
        email,
        data: {
          username,
          account: {
            name: 'Gestion eSports',
          },
          verify_url: `${config.cors.frontendUrl}${APP_ROUTES.VERIFY_EMAIL}?token=${token}`,
          support_email: config.mail.from,
        },
      },
    ];
    const sentFrom = new Sender(config.mail.from, personalization[0].data.account.name);
    const recipients = [new Recipient(email)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setPersonalization(personalization)
      .setTemplateId('ynrw7gyqqmj42k8e')
      .setSubject('Por favor, verifica tu correo');

    await mailerSend.email.send(emailParams);
  }

  /**
   * Resend verification email
   * @param {string} email
   * @returns {Promise<void>}
   */
  async resendVerification(email) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        API_ERROR_CODES.AUTH_USER_NOT_FOUND
      );
    }

    if (user.isVerified) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED],
        API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED
      );
    }

    // Generar nuevo token de verificación
    const verificationToken = uuidv4();
    const verificationExpiresAt = new Date(Date.now() + config.tokens.verificationExpiration);

    await this.userRepository.setVerificationToken(
      user.id,
      verificationToken,
      verificationExpiresAt
    );

    // Enviar email de verificación
    await this.sendVerificationEmail(user.email, user.username, verificationToken);
  }

  /**
   * Clean expired verification tokens (optional maintenance task)
   * @returns {Promise<number>} Number of tokens cleaned
   */
  async cleanExpiredVerificationTokens() {
    return await this.userRepository.cleanExpiredVerificationTokens();
  }
}
