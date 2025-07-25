import crypto from 'crypto';

import bcrypt from 'bcryptjs';
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

/**
 * Authentication service
 * Handles user authentication, registration, and session management
 *
 * @typedef {import('../../domain/entities/User').User} User
 * @typedef {import('../../domain/repositories/UserRepository').UserRepository} UserRepository
 * @typedef {import('../../domain/entities/SessionToken').SessionToken} SessionToken
 * @typedef {import('../../infrastructure/repositories/PrismaSessionTokenRepository').PrismaSessionTokenRepository} SessionTokenRepository
 *
 * @typedef {Object} LoginResult
 * @property {User} user - The authenticated user
 * @property {string} accessToken - JWT access token
 * @property {string} refreshToken - JWT refresh token
 *
 * @typedef {Object} RegisterResult
 * @property {User} user - The created user
 *
 * @typedef {Object} VerificationResult
 * @property {boolean} isValid - Whether the token is valid
 * @property {string} [reason] - Reason for invalidity
 *
 * @typedef {Object} ResetPasswordResult
 * @property {boolean} isValid - Whether the token is valid
 * @property {string} [reason] - Reason for invalidity
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

    if (existingByEmail) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS],
        code: API_ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'email',
              code: 'DUPLICATE',
              message: 'This email is already in use',
            },
          ],
        },
      });
    }

    if (existingByUsername) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS],
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'username',
              code: 'DUPLICATE',
              message: 'This username is already in use',
            },
          ],
        },
      });
    }

    const verificationToken = uuidv4();
    const verificationExpiresAt = new Date(Date.now() + config.tokens.verificationExpiration);

    try {
      await this.sendVerificationEmail(email, username, verificationToken);
    } catch (error) {
      console.error('Error sending verification email:', error);

      // Email failed - throw specific error to prevent user creation
      throw createError({
        message: 'Registration failed: Unable to send verification email. Please try again later.',
        code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
        status: HTTP_STATUS.SERVICE_UNAVAILABLE,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'email_service',
              code: 'EMAIL_SERVICE_FAILED',
              message: 'Email service is temporarily unavailable',
            },
          ],
        },
      });
    }

    // Email sent successfully - NOW create the user
    const createdUser = await this.userRepository.create({
      email,
      username,
      password,
      role: USER_ROLES.USER,
      verificationToken,
      verificationExpiresAt,
    });

    if (!createdUser) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [{ field: 'database', code: 'DATABASE_ERROR', message: 'Error creating user' }],
        },
      });
    }

    // Exclude passwordHash before return
    const { passwordHash, ...user } = createdUser;

    return user;
  }

  /**
   * Verify the email of a user
   * @param {string} token
   * @returns {Promise<{status: string, message: string, resendRequired: boolean}>}
   */
  async verifyEmail(token) {
    const sanitizedToken = sanitizeString(token);

    if (!REGEX.UUID_V4.test(sanitizedToken)) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'token',
              code: 'INVALID',
              message: 'Invalid verification token',
            },
          ],
        },
      });
    }

    // Use sanitized token from now on
    const user = await this.userRepository.findByVerificationToken(sanitizedToken);

    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'token',
              code: 'INVALID',
              message: 'Invalid verification token',
            },
          ],
        },
      });
    }

    if (user.isVerified) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED],
        code: API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'token',
              code: 'INVALID',
              message: 'Invalid verification token',
            },
          ],
        },
      });
    }

    // Check token expiration
    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_EXPIRED],
        code: API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'token',
              code: 'EXPIRED',
              message: 'Verification token has expired',
            },
          ],
        },
      });
    }
    // Mark as verified
    try {
      const verifiedUser = await this.userRepository.setVerified(user.id, true);

      if (!verifiedUser) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_UPDATE_FAILED],
          code: API_ERROR_CODES.AUTH_UPDATE_FAILED,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          errorDetails: {
            type: 'server',
            details: [
              {
                field: 'database',
                code: 'DATABASE_ERROR',
                message: 'Error setting user as verified',
              },
            ],
          },
        });
      }

      return verifiedUser;
    } catch {
      throw createError({
        message: 'Token is valid but user update failed',
        code: API_ERROR_CODES.AUTH_UPDATE_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'DATABASE_ERROR',
              message: 'Database operation failed',
            },
          ],
        },
      });
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
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        code: API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'email',
              code: 'INVALID',
              message: 'Invalid email',
            },
          ],
        },
      });
    }

    const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash);
    if (!isValidPassword) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_FORBIDDEN],
        code: API_ERROR_CODES.AUTH_FORBIDDEN,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'password',
              code: 'INVALID',
              message: 'Invalid password',
            },
          ],
        },
      });
    }

    /**
     * @TODO: Implement Account Lockout (Blocked accounts)
     */

    if (!dbUser.isVerified) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.EMAIL_NOT_VERIFIED],
        code: API_ERROR_CODES.EMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'email',
              code: 'NOT_VERIFIED',
              message: 'Email not verified',
            },
          ],
        },
      });
    }

    // Update last login tracking
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
      is_active: dbUser.isActive,
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
        expiresAt: new Date(Date.now() + config.jwt.refreshExpiresIn),
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
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'NOT_FOUND',
              message: 'User not found',
            },
          ],
        },
      });
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
      if (!refreshToken) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
          code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'refreshToken',
                code: 'INVALID',
                message: 'Missing refresh token',
              },
            ],
          },
        });
      }
      // Check if refreshToken exists in session_tokens
      const sessionToken = await this.sessionTokenRepository.findByToken(refreshToken);
      if (!sessionToken) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
          code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'refresh_token',
                code: 'NOT_FOUND',
                message: 'Refresh token not found',
              },
            ],
          },
        });
      }

      if (sessionToken.expiresAt < new Date()) {
        // Token expired -> delete record and throw error
        const deletedToken = await this.sessionTokenRepository.deleteById(sessionToken.id);

        if (!deletedToken) {
          throw createError({
            message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
            code: API_ERROR_CODES.DATABASE_ERROR,
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            errorDetails: {
              type: 'server',
              details: [
                {
                  field: 'refresh_token',
                  code: 'DATABASE_ERROR',
                  message: 'Error deleting expired refresh token',
                },
              ],
            },
          });
        }

        // Token was expired and successfully deleted - throw AUTH_TOKEN_EXPIRED
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_EXPIRED],
          code: API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
          status: HTTP_STATUS.UNAUTHORIZED,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'refresh_token',
                code: 'EXPIRED',
                message: 'Refresh token has expired',
              },
            ],
          },
        });
      }

      // Update last activity
      await this.sessionTokenRepository.update(sessionToken.id, { lastActivityAt: new Date() });

      // Verify refresh token signature and get payload
      const payload = this.tokenService.verifyRefreshToken(refreshToken);

      // Get user to include updated data (in case the role changed)
      const dbUser = await this.userRepository.findById(payload.userId);

      if (!dbUser) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
          code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
          status: HTTP_STATUS.UNAUTHORIZED,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'user',
                code: 'NOT_FOUND',
                message: 'User not found',
              },
            ],
          },
        });
      }

      // Generate new tokens and replace refresh in DB
      const newTokens = this.tokenService.generateTokens({
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      });

      if (!newTokens) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
          code: API_ERROR_CODES.DATABASE_ERROR,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          errorDetails: {
            type: 'server',
            details: [
              {
                field: 'database',
                code: 'DATABASE_ERROR',
                message: 'Error generating new tokens',
              },
            ],
          },
        });
      }

      // Update refresh token in session_tokens
      const updatedToken = await this.sessionTokenRepository.update(sessionToken.id, {
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + config.jwt.refreshExpiresIn),
      });

      if (!updatedToken) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
          code: API_ERROR_CODES.DATABASE_ERROR,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          errorDetails: {
            type: 'server',
            details: [
              {
                field: 'database',
                code: 'DATABASE_ERROR',
                message: 'Error updating refresh token',
              },
            ],
          },
        });
      }

      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'refresh_token',
              code: 'INVALID',
              message: 'Invalid refresh token',
            },
          ],
        },
      });
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
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'refresh_token',
              code: 'NOT_FOUND',
              message: 'Refresh token not found',
            },
          ],
        },
      });
    }

    return true;
  }

  /**
   * Start the password reset process
   * @param {string} email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    const dbUser = await this.userRepository.findByEmail(email);

    if (!dbUser) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'NOT_FOUND',
              message: 'User not found',
            },
          ],
        },
      });
    }

    // Generate a secure 64-character hexadecimal token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + config.tokens.passwordResetExpiration);

    try {
      await this.sendResetPasswordEmail(email, dbUser.username, resetToken);
    } catch (error) {
      console.error('Error sending reset password email:', error);

      // Email failed - throw specific error to prevent user creation
      throw createError({
        message:
          'Reset password failed: Unable to send reset password email. Please try again later.',
        code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
        status: HTTP_STATUS.SERVICE_UNAVAILABLE,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'email_service',
              code: 'EMAIL_SERVICE_FAILED',
              message: 'Email service is temporarily unavailable',
            },
          ],
        },
      });
    }

    // Email sent successfully - NOW update the user
    const updatedUser = await this.userRepository.setResetToken(
      dbUser.id,
      resetToken,
      resetExpiresAt
    );

    if (!updatedUser) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'DATABASE_ERROR',
              message: 'Error setting reset token',
            },
          ],
        },
      });
    }

    return true;
  }

  /**
   * Reset user password
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   */
  async resetPassword(token, newPassword) {
    try {
      // 1. Validate token format
      if (!this.isValidTokenFormat(token)) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_RESET_TOKEN_MALFORMED],
          code: API_ERROR_CODES.AUTH_RESET_TOKEN_MALFORMED,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'token',
                code: 'INVALID_FORMAT',
                message: 'Token format is invalid',
              },
            ],
          },
        });
      }

      // 2. Find user by reset token (only valid, non-expired, non-used tokens)
      const user = await this.userRepository.findByResetToken(token);

      if (!user) {
        // Check if token exists but is expired/used to provide specific error
        const userAny = await this.userRepository.findByResetTokenAny(token);

        if (!userAny) {
          throw createError({
            message: ERROR_MESSAGES[API_ERROR_CODES.INVALID_RESET_TOKEN],
            code: API_ERROR_CODES.INVALID_RESET_TOKEN,
            status: HTTP_STATUS.NOT_FOUND,
            errorDetails: {
              type: 'business',
              details: [
                {
                  field: 'token',
                  code: 'NOT_FOUND',
                  message: 'Reset token not found',
                },
              ],
            },
          });
        }

        // Token exists but is invalid - check why
        if (userAny.resetTokenUsed) {
          throw createError({
            message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_ALREADY_USED],
            code: API_ERROR_CODES.AUTH_TOKEN_ALREADY_USED,
            status: HTTP_STATUS.CONFLICT,
            errorDetails: {
              type: 'business',
              details: [
                {
                  field: 'token',
                  code: 'ALREADY_USED',
                  message: 'This token has already been used',
                },
              ],
            },
          });
        }

        if (userAny.resetExpiresAt && userAny.resetExpiresAt < new Date()) {
          throw createError({
            message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_EXPIRED],
            code: API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
            status: HTTP_STATUS.BAD_REQUEST,
            errorDetails: {
              type: 'business',
              details: [
                {
                  field: 'token',
                  code: 'EXPIRED',
                  message: 'The reset link has expired',
                },
              ],
            },
          });
        }
      }

      // 3. Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // 4. Update password and mark token as used
      const updatedUser = await this.userRepository.setNewPassword(user.id, hashedPassword);

      if (!updatedUser) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
          code: API_ERROR_CODES.DATABASE_ERROR,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          errorDetails: {
            type: 'server',
            details: [
              {
                field: 'database',
                code: 'DATABASE_ERROR',
                message: 'Failed to update password in database',
              },
            ],
          },
        });
      }

      // 5. TODO: Invalidate all existing sessions for this user
      // await this.sessionTokenRepository.invalidateUserSessions(user.id);

      return true;
    } catch (error) {
      // Re-throw known errors
      if (error.code) {
        throw error;
      }

      // Handle unexpected errors
      console.error('Unexpected error in resetPassword:', error);
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'DATABASE_ERROR',
              message: 'Database operation failed during password reset',
            },
          ],
        },
      });
    }
  }

  /**
   * Validate reset token without modifying anything
   * @param {string} token - Reset token to validate
   * @returns {Promise<{isValid: boolean, isExpired?: boolean, userExists?: boolean}>}
   */
  async validateResetToken(token) {
    try {
      // 1. Validate token format (hexadecimal, 64 characters)
      if (!this.isValidTokenFormat(token)) {
        return {
          isValid: false,
          isExpired: false,
          userExists: false,
        };
      }

      // 2. Find user by token (includes expired and used tokens)
      const user = await this.userRepository.findByResetTokenAny(token);

      if (!user) {
        return {
          isValid: false,
          isExpired: false,
          userExists: false,
        };
      }

      // 3. Check if user is active
      if (!user.isActive) {
        return {
          isValid: false,
          isExpired: false,
          userExists: false,
        };
      }

      // 4. Check if token has already been used
      if (user.resetTokenUsed) {
        return {
          isValid: false,
          isExpired: false,
          userExists: true,
        };
      }

      // 5. Check token expiration
      if (user.resetExpiresAt && user.resetExpiresAt < new Date()) {
        return {
          isValid: false,
          isExpired: true,
          userExists: true,
        };
      }

      // Token is valid
      return {
        isValid: true,
        isExpired: false,
        userExists: true,
      };
    } catch (error) {
      console.error('Error validating reset token:', error);
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'DATABASE_ERROR',
              message: 'Database operation failed during token validation',
            },
          ],
        },
      });
    }
  }

  /**
   * Validate token format (hexadecimal, 64 characters)
   * @param {string} token - Token to validate
   * @returns {boolean}
   */
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;
    if (token.length !== 64) return false;
    const tokenRegex = /^[a-fA-F0-9]{64}$/;
    return tokenRegex.test(token);
  }

  /**
   * Send verification email using Mailgun
   * @param {string} email
   * @param {string} token
   */
  async sendVerificationEmail(email, username, token) {
    if (!config.mail) {
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
          verify_url: `${config.cors.frontendUrl}${APP_ROUTES.VERIFY_EMAIL}/${token}`,
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
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'NOT_FOUND',
              message: 'User not found',
            },
          ],
        },
      });
    }

    if (user.isVerified) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED],
        code: API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'ALREADY_VERIFIED',
              message: 'User already verified',
            },
          ],
        },
      });
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
   * Send forgot password email using Mailgun
   * @param {string} email
   * @param {string} username
   * @param {string} token
   */
  async sendResetPasswordEmail(email, username, token) {
    if (!config.mail) {
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
          verify_url: `${config.cors.frontendUrl}${APP_ROUTES.RESET_PASSWORD}/${token}`,
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
      .setTemplateId('vywj2lpzppjg7oqz')
      .setSubject('Change your password');

    await mailerSend.email.send(emailParams);
  }

  /**
   * Clean expired verification tokens (optional maintenance task)
   * @returns {Promise<number>} Number of tokens cleaned
   */
  async cleanExpiredVerificationTokens() {
    return await this.userRepository.cleanExpiredVerificationTokens();
  }
}
