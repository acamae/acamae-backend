import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../shared/constants/appRoutes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * Register a new user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async register(req, res, next) {
    try {
      const { email, password, username } = req.body;
      const createdUser = await this.authService.register({
        email,
        password,
        username,
      });

      // Registration successful - user created and email sent
      return res
        .status(HTTP_STATUS.CREATED)
        .apiSuccess(
          createdUser,
          'User registered successfully. Check your email to verify your account.'
        );
    } catch (error) {
      // Delegate error handling to global error middleware for consistency
      next(error);
    }
  }

  /**
   * Verify user email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.params.token;

      // If no token -> redirect to re-send page
      if (!token) {
        return res.redirect(APP_ROUTES.VERIFY_EMAIL_RESEND);
      }

      const verifiedUser = await this.authService.verifyEmail(token);
      return res.status(HTTP_STATUS.OK).apiSuccess(verifiedUser, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Extract client IP address
      const ipAddress =
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        'unknown';

      const result = await this.authService.login(email, password, ipAddress);
      return res.status(HTTP_STATUS.OK).apiSuccess(result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user information
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getMe(req, res, next) {
    try {
      const user = await this.authService.getMe(req.user.id);
      return res.status(HTTP_STATUS.OK).apiSuccess(user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      return res.status(HTTP_STATUS.OK).apiSuccess(tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Session closed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start password reset process
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      return res
        .status(HTTP_STATUS.OK)
        .apiSuccess(null, 'We have sent you a link to reset your password');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate reset token
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async validateResetToken(req, res, next) {
    try {
      const { token } = req.params;
      const { token: tokenBody } = req.body;

      // Use token from params or body (frontend sends in body)
      const resetToken = token || tokenBody;

      const validation = await this.authService.validateResetToken(resetToken);

      if (validation.isValid) {
        return res.status(HTTP_STATUS.OK).apiSuccess(validation, 'Token validation successful');
      } else {
        // Determine appropriate status code based on validation result
        let statusCode = HTTP_STATUS.BAD_REQUEST;
        let errorCode = API_ERROR_CODES.INVALID_RESET_TOKEN;

        if (!validation.userExists) {
          statusCode = HTTP_STATUS.NOT_FOUND;
          errorCode = API_ERROR_CODES.INVALID_RESET_TOKEN;
        } else if (validation.isExpired) {
          statusCode = HTTP_STATUS.BAD_REQUEST;
          errorCode = API_ERROR_CODES.AUTH_TOKEN_EXPIRED;
        } else {
          // Token is invalid for other reasons (used, malformed, etc.)
          statusCode = HTTP_STATUS.BAD_REQUEST;
          errorCode = API_ERROR_CODES.AUTH_TOKEN_INVALID;
        }

        return res.apiError(statusCode, errorCode, 'Token validation failed', {
          type: 'business',
          details: [
            {
              field: 'token',
              code: errorCode,
              message: 'Token validation failed',
            },
          ],
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body; // Changed from newPassword to password according to Swagger
      await this.authService.resetPassword(token, password);
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Password has been reset successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async resendVerification(req, res, next) {
    try {
      const { identifier } = req.body; // Changed from email to identifier according to Swagger
      await this.authService.resendVerification(identifier);
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'New link sent. Check your inbox.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle verification email sent status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmailSent(req, res, next) {
    try {
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Verification email sent successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle verification email success status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmailSuccess(req, res, next) {
    try {
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Email verification completed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle verification email expired status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmailExpired(req, res, next) {
    try {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .apiError(
          HTTP_STATUS.BAD_REQUEST,
          API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
          'Verification link has expired',
          {
            type: 'business',
            details: [
              {
                field: 'token',
                code: 'EXPIRED',
                message: 'Verification link has expired',
              },
            ],
          }
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle verification email already verified status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmailAlreadyVerified(req, res, next) {
    try {
      return res
        .status(HTTP_STATUS.CONFLICT)
        .apiError(
          HTTP_STATUS.CONFLICT,
          API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
          'Email is already verified',
          {
            type: 'business',
            details: [
              {
                field: 'user',
                code: 'ALREADY_VERIFIED',
                message: 'Email is already verified',
              },
            ],
          }
        );
    } catch (error) {
      next(error);
    }
  }

  async resetPasswordSent(req, res, next) {
    try {
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Reset password email sent');
    } catch (error) {
      next(error);
    }
  }

  async resetPasswordSuccess(req, res, next) {
    try {
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Reset password successful');
    } catch (error) {
      next(error);
    }
  }

  async resetPasswordError(req, res, next) {
    try {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .apiError(
          HTTP_STATUS.BAD_REQUEST,
          API_ERROR_CODES.AUTH_TOKEN_INVALID,
          'Reset password error',
          {
            type: 'business',
            details: [
              {
                field: 'token',
                code: 'INVALID',
                message: 'Reset password error',
              },
            ],
          }
        );
    } catch (error) {
      next(error);
    }
  }

  async resetPasswordExpired(req, res, next) {
    try {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .apiError(
          HTTP_STATUS.BAD_REQUEST,
          API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
          'Reset password expired',
          {
            type: 'business',
            details: [
              {
                field: 'token',
                code: 'EXPIRED',
                message: 'Reset password expired',
              },
            ],
          }
        );
    } catch (error) {
      next(error);
    }
  }
}
