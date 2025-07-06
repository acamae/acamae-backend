import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../shared/constants/appRoutes.js';
import { createError } from '../../shared/utils/error.js';

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
      const { user, emailSent, emailError } = await this.authService.register({
        email,
        password,
        username,
      });

      const response = {
        user,
        emailSent,
        redirect: APP_ROUTES.VERIFY_EMAIL_SENT,
      };

      if (!emailSent && emailError) {
        response.emailError = emailError;
      }

      const message = emailSent
        ? 'User registered successfully. Verification email sent.'
        : 'User registered successfully. However, verification email could not be sent.';

      res.status(201).json({
        status: 'success',
        message,
        data: response,
      });
    } catch (error) {
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

      const result = await this.authService.verifyEmail(token);

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        data: result,
        status: 200,
        code: 'SUCCESS',
      });
    } catch (error) {
      // Manejar errores específicos con respuestas personalizadas
      if (error.customResponse) {
        const { status, message, resendRequired } = error.customResponse;

        let httpStatus;
        let errorCode;

        switch (status) {
          case 'invalid_token':
            httpStatus = 400;
            errorCode = 'AUTH_TOKEN_INVALID';
            break;
          case 'expired_token':
            httpStatus = 410;
            errorCode = 'AUTH_TOKEN_EXPIRED';
            break;
          case 'already_verified':
            httpStatus = 409;
            errorCode = 'AUTH_USER_ALREADY_VERIFIED';
            break;
          case 'update_failed':
            httpStatus = 500;
            errorCode = 'ERR_NETWORK';
            break;
        }

        return res.status(httpStatus).json({
          success: false,
          data: {
            status,
            message,
            resendRequired,
          },
          status: httpStatus,
          code: errorCode,
        });
      }

      // Error genérico
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
      const result = await this.authService.login(email, password);
      res.status(200).json({ status: 'success', message: 'Login successfully', data: result });
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
      res.status(200).json({ status: 'success', data: user });
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
      if (!refreshToken) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
          API_ERROR_CODES.INVALID_REFRESH_TOKEN
        );
      }
      const tokens = await this.authService.refreshToken(refreshToken);
      res
        .status(200)
        .json({ status: 'success', message: 'Token successfully refreshed', data: tokens });
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
      res.status(200).json({ status: 'success', message: 'Logout successfully', data: null });
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
      res.status(200).json({
        status: 'success',
        message: 'If the email exists, you will receive instructions to recover your password',
        data: null,
      });
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
      const { newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      res
        .status(200)
        .json({ status: 'success', message: 'Password updated successfully', data: null });
    } catch (error) {
      next(error);
    }
  }

  resendVerification = async (req, res) => {
    try {
      const { email } = req.body;
      await this.authService.resendVerification(email);
      res
        .status(200)
        .json({ status: 'success', message: 'Verification email resent successfully', data: null });
    } catch (error) {
      next(error);
    }
  };
}
