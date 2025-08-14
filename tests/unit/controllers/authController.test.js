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
      validateResetToken: jest.fn(),
      resendVerification: jest.fn(),
    };
    controller = new AuthController(service);
    res = makeRes();
    next = jest.fn();
  });

  describe('register', () => {
    it('should register user successfully when email is sent', async () => {
      const createdUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      service.register.mockResolvedValue(createdUser);
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
        createdUser,
        'User registered successfully. Check your email to verify your account.'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle email service failure during registration', async () => {
      const emailError = new Error('Email service failed');
      emailError.status = HTTP_STATUS.SERVICE_UNAVAILABLE;
      emailError.code = API_ERROR_CODES.SERVICE_UNAVAILABLE;
      emailError.message =
        'Registration failed: Unable to send verification email. Please try again later.';
      emailError.error = {
        type: 'server',
        details: [
          {
            field: 'email_service',
            code: 'EMAIL_SERVICE_FAILED',
            message: 'Email service is temporarily unavailable',
          },
        ],
      };
      service.register.mockRejectedValue(emailError);

      const req = {
        body: { email: 'test@example.com', password: 'Password123!', username: 'testuser' },
      };

      await controller.register(req, res, next);

      expect(next).toHaveBeenCalledWith(emailError);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      const error = new Error('Service error');
      service.register.mockRejectedValue(error);
      const req = {
        body: { email: 'test@example.com', password: 'Password123!', username: 'testuser' },
      };

      await controller.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
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
      const verifiedUser = { id: '1', email: 'test@example.com', isVerified: true };
      service.verifyEmail.mockResolvedValue(verifiedUser);
      const req = { query: { token: 'test-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(service.verifyEmail).toHaveBeenCalledWith('test-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(verifiedUser, 'Email verified successfully');
    });

    it('should verify email when token in params', async () => {
      const verifiedUser = { id: '1', email: 'test@example.com', isVerified: true };
      service.verifyEmail.mockResolvedValue(verifiedUser);
      const req = { query: {}, params: { token: 'test-token' } };

      await controller.verifyEmail(req, res, next);

      expect(service.verifyEmail).toHaveBeenCalledWith('test-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('should handle invalid_token custom response', async () => {
      const error = new Error('Invalid token');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'invalid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should handle expired_token custom response', async () => {
      const error = new Error('Expired token');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'expired-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should handle already_verified custom response', async () => {
      const error = new Error('Already verified');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should handle AUTH_USER_ALREADY_VERIFIED custom response', async () => {
      const error = new Error('Already verified');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should handle update_failed custom response', async () => {
      const error = new Error('Update failed');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should handle unknown custom response status', async () => {
      const error = new Error('Unknown error');
      service.verifyEmail.mockRejectedValue(error);
      const req = { query: { token: 'valid-token' }, params: {} };

      await controller.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
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
      const loginResult = { user: { id: '1', email: 'test@example.com' }, accessToken: 'token' };
      service.login.mockResolvedValue(loginResult);
      const req = {
        body: { email: 'test@example.com', password: 'password123' },
        ip: '192.168.1.1',
      };

      await controller.login(req, res, next);

      expect(service.login).toHaveBeenCalledWith('test@example.com', 'password123', '192.168.1.1');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(loginResult, 'Login successful');
    });

    it('should extract IP from various sources', async () => {
      const loginResult = { user: { id: '1', email: 'test@example.com' }, accessToken: 'token' };
      service.login.mockResolvedValue(loginResult);

      // Test x-forwarded-for header
      const req1 = {
        body: { email: 'test@example.com', password: 'password123' },
        headers: { 'x-forwarded-for': '203.0.113.1, 192.168.1.1' },
      };
      await controller.login(req1, res, next);
      expect(service.login).toHaveBeenCalledWith('test@example.com', 'password123', '203.0.113.1');

      // Test x-real-ip header
      const req2 = {
        body: { email: 'test@example.com', password: 'password123' },
        headers: { 'x-real-ip': '203.0.113.2' },
      };
      await controller.login(req2, res, next);
      expect(service.login).toHaveBeenCalledWith('test@example.com', 'password123', '203.0.113.2');

      // Test fallback to 'unknown'
      const req3 = {
        body: { email: 'test@example.com', password: 'password123' },
        headers: {},
      };
      await controller.login(req3, res, next);
      expect(service.login).toHaveBeenCalledWith('test@example.com', 'password123', 'unknown');
    });

    it('should call next on service error', async () => {
      const error = new Error('Login failed');
      service.login.mockRejectedValue(error);
      const req = {
        body: { email: 'test@example.com', password: 'password123' },
        ip: '192.168.1.1',
      };

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.apiError).not.toHaveBeenCalled();
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
      expect(res.apiSuccess).toHaveBeenCalledWith(user, 'User retrieved successfully');
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
    it('should refresh token successfully', async () => {
      const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      service.refreshToken.mockResolvedValue(tokens);
      const req = { body: { refreshToken: 'old-refresh-token' } };

      await controller.refreshToken(req, res, next);

      expect(service.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(tokens, 'Token refreshed successfully');
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
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Session closed successfully');
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
        'We have sent you a link to reset your password'
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
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Password has been reset successfully');
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

  describe('validateResetToken', () => {
    it('should validate token successfully when token is valid', async () => {
      const validationResponse = {
        isValid: true,
        isExpired: false,
        userExists: true,
        message: 'Token is valid',
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: { token: 'valid-token' },
        body: { token: 'valid-token' },
      };

      await controller.validateResetToken(req, res, next);

      expect(service.validateResetToken).toHaveBeenCalledWith('valid-token');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.apiSuccess).toHaveBeenCalledWith(
        validationResponse,
        'Token validation successful'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should use token from params when no token in body', async () => {
      const validationResponse = {
        isValid: true,
        isExpired: false,
        userExists: true,
        message: 'Token is valid',
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: { token: 'param-token' },
        body: {},
      };

      await controller.validateResetToken(req, res, next);

      expect(service.validateResetToken).toHaveBeenCalledWith('param-token');
    });

    it('should use token from body when no token in params', async () => {
      const validationResponse = {
        isValid: true,
        isExpired: false,
        userExists: true,
        message: 'Token is valid',
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: {},
        body: { token: 'body-token' },
      };

      await controller.validateResetToken(req, res, next);

      expect(service.validateResetToken).toHaveBeenCalledWith('body-token');
    });

    it('should return error when token not found', async () => {
      const validationResponse = {
        isValid: false,
        isExpired: false,
        userExists: false,
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: { token: 'nonexistent-token' },
        body: { token: 'nonexistent-token' },
      };

      await controller.validateResetToken(req, res, next);

      // Updated to check for direct JSON response instead of apiError call
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: validationResponse, // Now includes validation data
        status: HTTP_STATUS.NOT_FOUND,
        code: API_ERROR_CODES.INVALID_RESET_TOKEN,
        message: 'Token validation failed',
        timestamp: expect.any(String),
        requestId: expect.any(String),
        error: {
          type: 'business',
          details: [
            {
              field: 'token',
              code: 'NOT_FOUND',
              message: 'Token not found or user does not exist',
            },
          ],
        },
      });
    });

    it('should return error when token is expired', async () => {
      const validationResponse = {
        isValid: false,
        isExpired: true,
        userExists: true,
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: { token: 'expired-token' },
        body: { token: 'expired-token' },
      };

      await controller.validateResetToken(req, res, next);

      // Updated to check for direct JSON response instead of apiError call
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: validationResponse, // Now includes validation data
        status: HTTP_STATUS.BAD_REQUEST,
        code: API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        message: 'Token validation failed',
        timestamp: expect.any(String),
        requestId: expect.any(String),
        error: {
          type: 'business',
          details: [
            {
              field: 'token',
              code: 'EXPIRED',
              message: 'Token has expired',
            },
          ],
        },
      });
    });

    it('should return error when token is already used', async () => {
      const validationResponse = {
        isValid: false,
        isExpired: false,
        userExists: true,
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: { token: 'used-token' },
        body: { token: 'used-token' },
      };

      await controller.validateResetToken(req, res, next);

      // Updated to check for direct JSON response instead of apiError call
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: validationResponse, // Now includes validation data
        status: HTTP_STATUS.BAD_REQUEST,
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Token validation failed',
        timestamp: expect.any(String),
        requestId: expect.any(String),
        error: {
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
    });

    it('should return bad request for other invalid states', async () => {
      const validationResponse = {
        isValid: false,
        isExpired: false,
        userExists: true,
      };
      service.validateResetToken.mockResolvedValue(validationResponse);

      const req = {
        params: { token: 'malformed-token' },
        body: { token: 'malformed-token' },
      };

      await controller.validateResetToken(req, res, next);

      // Updated to check for direct JSON response instead of apiError call
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: validationResponse, // Now includes validation data
        status: HTTP_STATUS.BAD_REQUEST,
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Token validation failed',
        timestamp: expect.any(String),
        requestId: expect.any(String),
        error: {
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
    });

    it('should call next on service error', async () => {
      const error = new Error('Database error');
      service.validateResetToken.mockRejectedValue(error);

      const req = {
        params: { token: 'any-token' },
        body: { token: 'any-token' },
      };

      await controller.validateResetToken(req, res, next);

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
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'New link sent. Check your inbox.');
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
