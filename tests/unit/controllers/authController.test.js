import { AuthController } from '../../../src/infrastructure/controllers/AuthController.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../../src/shared/constants/appRoutes.js';

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

  it('register -> 201', async () => {
    service.register.mockResolvedValue({
      user: { id: 1, email: 'e', username: 'u' },
      emailSent: true,
      emailError: null,
    });
    const req = { body: { email: 'e', password: 'p', username: 'u' } };
    await controller.register(req, res, next);
    expect(service.register).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.apiSuccess).toHaveBeenCalledWith(null, expect.stringContaining('exitosamente'));
  });

  describe('verifyEmail', () => {
    it('redirects when no token', async () => {
      const req = { query: {}, params: {} };
      await controller.verifyEmail(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith(APP_ROUTES.VERIFY_EMAIL_RESEND);
    });

    it('verifies email when token present', async () => {
      service.verifyEmail.mockResolvedValue();
      const req = { query: { token: 'abc' }, params: {} };
      await controller.verifyEmail(req, res, next);
      expect(service.verifyEmail).toHaveBeenCalledWith('abc');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  it('login -> 200', async () => {
    const data = { accessToken: 'a' };
    service.login.mockResolvedValue(data);
    const req = { body: { email: 'e', password: 'p' } };
    await controller.login(req, res, next);
    expect(service.login).toHaveBeenCalledWith('e', 'p');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(data, 'Login exitoso');
  });

  it('getMe -> 200', async () => {
    const user = { id: '1' };
    service.getMe.mockResolvedValue(user);
    const req = { user: { id: '1' } };
    await controller.getMe(req, res, next);
    expect(service.getMe).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(user, 'Usuario obtenido exitosamente');
  });

  describe('refreshToken', () => {
    it('error when no token', async () => {
      const req = { body: {} };
      await controller.refreshToken(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.INVALID_REFRESH_TOKEN })
      );
    });

    it('SUCCESS', async () => {
      const tokens = { accessToken: 'new', refreshToken: 'r' };
      service.refreshToken.mockResolvedValue(tokens);
      const req = { body: { refreshToken: 'old' } };
      await controller.refreshToken(req, res, next);
      expect(service.refreshToken).toHaveBeenCalledWith('old');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(tokens, 'Token renovado exitosamente');
    });
  });

  it('logout -> 200', async () => {
    service.logout.mockResolvedValue();
    const req = { body: { refreshToken: 'r' } };
    await controller.logout(req, res, next);
    expect(service.logout).toHaveBeenCalledWith('r');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Sesión cerrada exitosamente');
  });

  it('forgotPassword -> 200', async () => {
    service.forgotPassword.mockResolvedValue();
    const req = { body: { email: 'e' } };
    await controller.forgotPassword(req, res, next);
    expect(service.forgotPassword).toHaveBeenCalledWith('e');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(
      null,
      'Te hemos enviado un enlace para restablecer tu contraseña'
    );
  });

  it('resetPassword -> 200', async () => {
    service.resetPassword.mockResolvedValue();
    const req = { params: { token: 't' }, body: { password: 'P' } };
    await controller.resetPassword(req, res, next);
    expect(service.resetPassword).toHaveBeenCalledWith('t', 'P');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Contraseña restablecida exitosamente');
  });

  it('resendVerification -> 200', async () => {
    service.resendVerification.mockResolvedValue();
    const req = { body: { identifier: 'e' } };
    await controller.resendVerification(req, res, next);
    expect(service.resendVerification).toHaveBeenCalledWith('e');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(
      null,
      'Nuevo enlace enviado. Revisa tu bandeja de entrada.'
    );
  });
});
