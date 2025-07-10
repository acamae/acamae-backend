import { AuthController } from '../../../src/infrastructure/controllers/AuthController.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../../src/shared/constants/appRoutes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = {
      register: jest.fn(),
      verifyEmail: jest.fn(),
      login: jest.fn(),
      getMe: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      resendVerification: jest.fn(),
    };
    controller = new AuthController(service);
    res = makeRes();
    next = jest.fn();
  });

  describe('register', () => {
    it('should register user successfully with email sent', async () => {
      service.register.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', username: 'testuser' },
        emailSent: true,
        emailError: null,
      });
      const req = {
        body: { email: 'test@example.com', password: 'Password123!', username: 'testuser' },
      };

      await controller.register(req, res, next);

      expect(service.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
      });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.apiSuccess).toHaveBeenCalledWith(
        null,
        'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should register user successfully with email failed', async () => {
      service.register.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', username: 'testuser' },
        emailSent: false,
        emailError: 'SMTP Error',
      });
      const req = {
        body: { email: 'test@example.com', password: 'Password123!', username: 'testuser' },
      };

      await controller.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.apiSuccess).toHaveBeenCalledWith(
        null,
        'Usuario registrado exitosamente. Sin embargo, no se pudo enviar el email de verificación.'
      );
    });

    it('should call next on service error', async () => {
      const error = new Error('Service error');
      service.register.mockRejectedValue(error);
      const req = {
        body: { email: 'test@example.com', password: 'Password123!', username: 'testuser' },
      };

      await controller.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should redirect when no token in query or params', async () => {
      const req = { query: {}, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(APP_ROUTES.VERIFY_EMAIL_RESEND);
      expect(service.verifyEmail).not.toHaveBeenCalled();
    });

    it('should verify email when token in query', async () => {
      service.verifyEmail.mockResolvedValue();
      const req = { query: { token: 'test-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(service.verifyEmail).toHaveBeenCalledWith('test-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Email verificado correctamente');
    });

    it('should verify email when token in params', async () => {
      service.verifyEmail.mockResolvedValue();
      const req = { query: {}, params: { token: 'test-token' } };

      await controller.verifyEmail(req, res, next);

      expect(service.verifyEmail).toHaveBeenCalledWith('test-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('should handle invalid_token custom response', async () => {
      const error = new Error('Invalid token');
      error.customResponse = { status: 'invalid_token' };
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'invalid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.BAD_REQUEST,
        API_ERROR_CODES.AUTH_TOKEN_INVALID,
        'El enlace de verificación no es válido',
        {
          type: 'authentication',
          details: [{ field: 'token', code: 'INVALID', message: 'El token no es válido' }],
        }
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired_token custom response', async () => {
      const error = new Error('Expired token');
      error.customResponse = { status: 'expired_token' };
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'expired-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.BAD_REQUEST,
        API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        'El enlace de verificación ha expirado',
        {
          type: 'authentication',
          details: [{ field: 'token', code: 'EXPIRED', message: 'El token ha expirado' }],
        }
      );
    });

    it('should handle already_verified custom response', async () => {
      const error = new Error('Already verified');
      error.customResponse = { status: 'already_verified' };
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.CONFLICT,
        API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
        'Esta cuenta ya ha sido verificada',
        {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'ALREADY_VERIFIED',
              message: 'El usuario ya está verificado',
            },
          ],
        }
      );
    });

    it('should handle AUTH_USER_ALREADY_VERIFIED custom response', async () => {
      const error = new Error('Already verified');
      error.customResponse = { status: 'AUTH_USER_ALREADY_VERIFIED' };
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.CONFLICT,
        API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
        'Esta cuenta ya ha sido verificada',
        {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'ALREADY_VERIFIED',
              message: 'El usuario ya está verificado',
            },
          ],
        }
      );
    });

    it('should handle update_failed custom response', async () => {
      const error = new Error('Update failed');
      error.customResponse = { status: 'update_failed' };
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        API_ERROR_CODES.AUTH_UPDATE_FAILED,
        'Error al actualizar el estado de verificación',
        {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'UPDATE_FAILED',
              message: 'No se pudo actualizar la base de datos',
            },
          ],
        }
      );
    });

    it('should handle unknown custom response status', async () => {
      const error = new Error('Unknown error');
      error.customResponse = { status: 'unknown_status' };
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        API_ERROR_CODES.UNKNOWN_ERROR,
        'Error interno del servidor',
        {
          type: 'server',
          details: [{ field: 'server', code: 'UNKNOWN', message: 'Error desconocido' }],
        }
      );
    });

    it('should call next for generic errors without customResponse', async () => {
      const error = new Error('Generic error');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginResult = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      service.login.mockResolvedValue(loginResult);
      const req = { body: { email: 'test@example.com', password: 'Password123!' } };

      await controller.login(req, res, next);

      expect(service.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(loginResult, 'Login exitoso');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('Login failed');
      service.login.mockRejectedValue(error);
      const req = { body: { email: 'test@example.com', password: 'wrongpass' } };

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user info successfully', async () => {
      const user = { id: '1', email: 'test@example.com', username: 'testuser' };
      service.getMe.mockResolvedValue(user);
      const req = { user: { id: '1' } };

      await controller.getMe(req, res, next);

      expect(service.getMe).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(user, 'Usuario obtenido exitosamente');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('User not found');
      service.getMe.mockRejectedValue(error);
      const req = { user: { id: '999' } };

      await controller.getMe(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should throw error when no refresh token provided', async () => {
      const req = { body: {} };

      await controller.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
          status: HTTP_STATUS.BAD_REQUEST,
        })
      );
      expect(service.refreshToken).not.toHaveBeenCalled();
    });

    it('should refresh token successfully', async () => {
      const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      service.refreshToken.mockResolvedValue(tokens);
      const req = { body: { refreshToken: 'old-refresh-token' } };

      await controller.refreshToken(req, res, next);

      expect(service.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(tokens, 'Token renovado exitosamente');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('Invalid refresh token');
      service.refreshToken.mockRejectedValue(error);
      const req = { body: { refreshToken: 'invalid-token' } };

      await controller.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      service.logout.mockResolvedValue();
      const req = { body: { refreshToken: 'refresh-token' } };

      await controller.logout(req, res, next);

      expect(service.logout).toHaveBeenCalledWith('refresh-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Sesión cerrada exitosamente');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('Logout failed');
      service.logout.mockRejectedValue(error);
      const req = { body: { refreshToken: 'invalid-token' } };

      await controller.logout(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset successfully', async () => {
      service.forgotPassword.mockResolvedValue();
      const req = { body: { email: 'test@example.com' } };

      await controller.forgotPassword(req, res, next);

      expect(service.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(
        null,
        'Te hemos enviado un enlace para restablecer tu contraseña'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('User not found');
      service.forgotPassword.mockRejectedValue(error);
      const req = { body: { email: 'nonexistent@example.com' } };

      await controller.forgotPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      service.resetPassword.mockResolvedValue();
      const req = {
        params: { token: 'reset-token' },
        body: { password: 'NewPassword123!' },
      };

      await controller.resetPassword(req, res, next);

      expect(service.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPassword123!');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Contraseña restablecida exitosamente');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('Invalid reset token');
      service.resetPassword.mockRejectedValue(error);
      const req = {
        params: { token: 'invalid-token' },
        body: { password: 'NewPassword123!' },
      };

      await controller.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      service.resendVerification.mockResolvedValue();
      const req = { body: { identifier: 'test@example.com' } };

      await controller.resendVerification(req, res, next);

      expect(service.resendVerification).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(
        null,
        'Nuevo enlace enviado. Revisa tu bandeja de entrada.'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('User not found');
      service.resendVerification.mockRejectedValue(error);
      const req = { body: { identifier: 'nonexistent@example.com' } };

      await controller.resendVerification(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
