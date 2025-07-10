import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../shared/constants/appRoutes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
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
      const { emailSent } = await this.authService.register({
        email,
        password,
        username,
      });

      // Follow Swagger specification: data null, message in Spanish
      const message = emailSent
        ? 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.'
        : 'Usuario registrado exitosamente. Sin embargo, no se pudo enviar el email de verificación.';

      return res.status(HTTP_STATUS.CREATED).apiSuccess(null, message);
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

      // Successful response according to Swagger
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Email verificado correctamente');
    } catch (error) {
      // Handle specific errors with custom responses
      if (error.customResponse) {
        const { status } = error.customResponse;

        let httpStatus;
        let errorCode;
        let spanishMessage;
        let errorDetails;

        switch (status) {
          case 'invalid_token':
          case 'AUTH_TOKEN_INVALID':
            httpStatus = HTTP_STATUS.BAD_REQUEST;
            errorCode = API_ERROR_CODES.AUTH_TOKEN_INVALID;
            spanishMessage = 'El enlace de verificación no es válido';
            errorDetails = {
              type: 'authentication',
              details: [{ field: 'token', code: 'INVALID', message: 'El token no es válido' }],
            };
            break;
          case 'expired_token':
          case 'AUTH_TOKEN_EXPIRED':
            httpStatus = HTTP_STATUS.BAD_REQUEST;
            errorCode = API_ERROR_CODES.AUTH_TOKEN_EXPIRED;
            spanishMessage = 'El enlace de verificación ha expirado';
            errorDetails = {
              type: 'authentication',
              details: [{ field: 'token', code: 'EXPIRED', message: 'El token ha expirado' }],
            };
            break;
          case 'already_verified':
          case 'AUTH_USER_ALREADY_VERIFIED':
            httpStatus = HTTP_STATUS.CONFLICT;
            errorCode = API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED;
            spanishMessage = 'Esta cuenta ya ha sido verificada';
            errorDetails = {
              type: 'business',
              details: [
                {
                  field: 'user',
                  code: 'ALREADY_VERIFIED',
                  message: 'El usuario ya está verificado',
                },
              ],
            };
            break;
          case 'update_failed':
          case 'AUTH_UPDATE_FAILED':
            httpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
            errorCode = API_ERROR_CODES.AUTH_UPDATE_FAILED;
            spanishMessage = 'Error al actualizar el estado de verificación';
            errorDetails = {
              type: 'server',
              details: [
                {
                  field: 'database',
                  code: 'UPDATE_FAILED',
                  message: 'No se pudo actualizar la base de datos',
                },
              ],
            };
            break;
          default:
            httpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
            errorCode = API_ERROR_CODES.UNKNOWN_ERROR;
            spanishMessage = 'Error interno del servidor';
            errorDetails = {
              type: 'server',
              details: [{ field: 'server', code: 'UNKNOWN', message: 'Error desconocido' }],
            };
        }

        return res.apiError(httpStatus, errorCode, spanishMessage, errorDetails);
      }

      // Generic error
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

      // Structure according to Swagger: UserWithTokens
      return res.status(HTTP_STATUS.OK).apiSuccess(result, 'Login exitoso');
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

      // Structure according to Swagger: User object
      return res.status(HTTP_STATUS.OK).apiSuccess(user, 'Usuario obtenido exitosamente');
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
          API_ERROR_CODES.INVALID_REFRESH_TOKEN,
          HTTP_STATUS.BAD_REQUEST
        );
      }
      const tokens = await this.authService.refreshToken(refreshToken);

      // Structure according to Swagger: object with accessToken and refreshToken
      return res.status(HTTP_STATUS.OK).apiSuccess(tokens, 'Token renovado exitosamente');
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

      // Structure according to Swagger: data null
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Sesión cerrada exitosamente');
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

      // Structure according to Swagger: data null, message in Spanish
      return res
        .status(HTTP_STATUS.OK)
        .apiSuccess(null, 'Te hemos enviado un enlace para restablecer tu contraseña');
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

      // Structure according to Swagger: data null, message in Spanish
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Contraseña restablecida exitosamente');
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

      // Structure according to Swagger: data null, message in Spanish
      return res
        .status(HTTP_STATUS.OK)
        .apiSuccess(null, 'Nuevo enlace enviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      next(error);
    }
  }
}
