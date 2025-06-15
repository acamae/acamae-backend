import { AuthService } from '../../application/services/AuthService.js';
import { UserRepository } from '../../domain/repositories/UserRepository.js';
import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

export class AuthController {
  constructor() {
    const userRepository = new UserRepository();
    this.authService = new AuthService(userRepository);
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
      const user = await this.authService.register({ email, password, username });
      res.success(user, 'Usuario registrado exitosamente');
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
      const { token } = req.params;
      await this.authService.verifyEmail(token);
      res.success(null, 'Email verificado exitosamente');
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
      res.success(result, 'Login exitoso');
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
      res.success(user);
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
        throw createError('Token de refresco requerido', API_ERROR_CODES.INVALID_REFRESH_TOKEN);
      }
      const tokens = await this.authService.refreshToken(refreshToken);
      res.success(tokens, 'Token refrescado exitosamente');
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
      res.success(null, 'Logout exitoso');
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
      res.success(null, 'Si el email existe, recibirás instrucciones para recuperar tu contraseña');
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
      res.success(null, 'Contraseña actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  resendVerification = async (req, res) => {
    try {
      const { email } = req.body;
      await this.authService.resendVerification(email);
      res.success(null, 'Email de verificación reenviado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };
}
