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
      const { user, emailSent, emailError } = await this.authService.register({
        email,
        password,
        username,
      });

      // Different response according to the email result
      if (emailSent) {
        // Email sent successfully - HTTP 201
        return res.status(HTTP_STATUS.CREATED).apiSuccess(
          {
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role,
              isVerified: user.isVerified,
            },
            emailSent: true,
          },
          'User registered successfully. Check your email to verify your account.'
        );
      } else {
        // Email failed - HTTP 207 (Multi-Status)
        return res.status(207).apiSuccess(
          {
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role,
              isVerified: user.isVerified,
            },
            emailSent: false,
            emailError: emailError,
          },
          'User registered successfully, but the verification email could not be sent. Contact the technical support.'
        );
      }
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

      // Successful response according to Swagger
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Email verificado correctamente');
    } catch (error) {
      // Handle specific errors with custom responses
      if (error.customResponse) {
        const { status, message, resendRequired } = error.customResponse;

        let httpStatus;
        let errorCode;
        let spanishMessage;
        let errorDetails;

        switch (status) {
          case 'invalid_token':
            httpStatus = HTTP_STATUS.BAD_REQUEST;
            errorCode = API_ERROR_CODES.AUTH_TOKEN_INVALID;
            spanishMessage = 'El enlace de verificación no es válido';
            errorDetails = {
              type: 'authentication',
              details: [{ field: 'token', code: 'INVALID', message: 'El token no es válido' }],
            };
            break;
          case 'expired_token':
            httpStatus = HTTP_STATUS.BAD_REQUEST;
            errorCode = API_ERROR_CODES.AUTH_TOKEN_EXPIRED;
            spanishMessage = 'El enlace de verificación ha expirado';
            errorDetails = {
              type: 'authentication',
              details: [{ field: 'token', code: 'EXPIRED', message: 'El token ha expirado' }],
            };
            break;
          case 'already_verified':
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

      // Extract user's IP address for tracking
      const ipAddress =
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);

      const result = await this.authService.login(email, password, ipAddress);

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
