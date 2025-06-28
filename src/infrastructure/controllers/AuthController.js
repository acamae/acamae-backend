import { AuthService } from '../../application/services/AuthService.js';
import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../shared/constants/appRoutes.js';
import { createError } from '../../shared/utils/error.js';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';

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
      await this.authService.register({ email, password, username });
      res.status(201).json({ status: 'success', message: 'User registered successfully' });
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

      await this.authService.verifyEmail(token);
      res
        .status(200)
        .json({ status: 'success', message: 'Email verified successfully', data: null });
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
