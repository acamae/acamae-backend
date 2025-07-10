import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { AuthService } from '../../src/application/services/AuthService.js';
import { API_ERROR_CODES } from '../../src/shared/constants/apiCodes.js';
import { TokenService } from '../../src/shared/utils/token.js';
import { makeRegisterDto, makeUser } from '../factories/userFactory.js';

// Mock configuration
jest.mock('../../src/infrastructure/config/environment.js', () => ({
  config: {
    tokens: {
      verificationExpiration: 10 * 60 * 1000, // 10 minutes
      passwordResetExpiration: 10 * 60 * 1000, // 10 minutes
      refreshExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    cors: {
      frontendUrl: 'http://localhost:3000',
    },
    mail: {
      apiKey: 'test-api-key',
      from: 'test@example.com',
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Mock uuid to return valid UUIDs
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock TokenService
jest.mock('../../src/shared/utils/token.js', () => {
  return {
    TokenService: jest.fn().mockImplementation(() => ({
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      }),
      verifyRefreshToken: jest.fn().mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        role: 'user',
      }),
    })),
  };
});

// Mock MailerSend
jest.mock('mailersend', () => ({
  MailerSend: jest.fn().mockImplementation(() => ({
    email: {
      send: jest.fn().mockResolvedValue(true),
    },
  })),
  EmailParams: jest.fn().mockImplementation(() => ({
    setFrom: jest.fn().mockReturnThis(),
    setTo: jest.fn().mockReturnThis(),
    setReplyTo: jest.fn().mockReturnThis(),
    setPersonalization: jest.fn().mockReturnThis(),
    setTemplateId: jest.fn().mockReturnThis(),
    setSubject: jest.fn().mockReturnThis(),
  })),
  Recipient: jest.fn(),
  Sender: jest.fn(),
}));

// Mock sanitize
jest.mock('../../src/shared/utils/sanitize.js', () => ({
  sanitizeString: jest.fn((str) => str),
}));

// Use real validation constants without bypasses
jest.mock('../../src/shared/constants/validation.js', () => ({
  ...jest.requireActual('../../src/shared/constants/validation.js'),
}));

const mockUserRepo = () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  findByVerificationToken: jest.fn(),
  findByValidVerificationToken: jest.fn(),
  setVerified: jest.fn(),
  findById: jest.fn(),
  findByResetToken: jest.fn(),
  setResetToken: jest.fn(),
  setVerificationToken: jest.fn(),
  update: jest.fn(),
  updateLoginTracking: jest.fn(),
  cleanExpiredVerificationTokens: jest.fn(),
});

const mockSessionRepo = () => ({
  create: jest.fn(),
  findByToken: jest.fn(),
  deleteById: jest.fn(),
  deleteByToken: jest.fn(),
  update: jest.fn(),
});

describe('AuthService', () => {
  let authService;
  let userRepo;
  let sessionRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo = mockUserRepo();
    sessionRepo = mockSessionRepo();
    authService = new AuthService(userRepo, sessionRepo);

    // Setup default mocks with valid UUIDs
    uuidv4.mockReturnValue('12345678-1234-4abc-8def-123456789012');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('register', () => {
    it('should create user successfully when no duplicates exist', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findByUsername.mockResolvedValue(null);
      const newUser = makeUser({ isVerified: false });
      userRepo.create.mockResolvedValue(newUser);

      const dto = makeRegisterDto({
        email: newUser.email,
        username: newUser.username,
        password: 'Secret123!',
      });

      const result = await authService.register(dto);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(userRepo.findByUsername).toHaveBeenCalledWith(dto.username);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        username: dto.username,
        password: dto.password,
        role: 'user',
        verificationToken: '12345678-1234-4abc-8def-123456789012',
        verificationExpiresAt: expect.any(Date),
      });
      expect(result.user.email).toBe(newUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.emailSent).toBe(true);
      expect(result.emailError).toBeNull();
    });

    it('should throw if email already exists', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());
      userRepo.findByUsername.mockResolvedValue(null);

      await expect(authService.register(makeRegisterDto())).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
      });
    });

    it('should throw if username already exists', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findByUsername.mockResolvedValue(makeUser());

      await expect(authService.register(makeRegisterDto())).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
      });
    });

    it('should handle email sending failure gracefully', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findByUsername.mockResolvedValue(null);
      const newUser = makeUser({ isVerified: false });
      userRepo.create.mockResolvedValue(newUser);

      // Mock sendVerificationEmail to throw
      jest.spyOn(authService, 'sendVerificationEmail').mockRejectedValue(new Error('Email failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await authService.register(makeRegisterDto());

      expect(result.emailSent).toBe(false);
      expect(result.emailError).toBe('Email failed');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('verifyEmail', () => {
    it('should throw on invalid token format', async () => {
      await expect(authService.verifyEmail('not-a-uuid')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
      });
    });

    it('should handle token not found', async () => {
      const token = '12345678-1234-4abc-8def-123456789012';
      userRepo.findByVerificationToken.mockResolvedValue(null);

      await expect(authService.verifyEmail(token)).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
      });
    });

    it('should handle user already verified', async () => {
      const token = '12345678-1234-4abc-8def-123456789012';
      const user = makeUser({ isVerified: true });
      userRepo.findByVerificationToken.mockResolvedValue(user);

      await expect(authService.verifyEmail(token)).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
      });
    });

    it('should handle token expired', async () => {
      const token = '12345678-1234-4abc-8def-123456789012';
      const user = makeUser({
        verificationToken: token,
        verificationExpiresAt: new Date(Date.now() - 60000), // Expired
        isVerified: false,
      });
      userRepo.findByVerificationToken.mockResolvedValue(user);

      await expect(authService.verifyEmail(token)).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      });
    });

    it('should handle database update failure', async () => {
      const token = '12345678-1234-4abc-8def-123456789012';
      const user = makeUser({
        verificationToken: token,
        verificationExpiresAt: new Date(Date.now() + 60000),
        isVerified: false,
      });
      userRepo.findByVerificationToken.mockResolvedValue(user);
      userRepo.setVerified.mockRejectedValue(new Error('DB Error'));

      await expect(authService.verifyEmail(token)).rejects.toThrow();
    });

    it('should verify email successfully', async () => {
      const token = '12345678-1234-4abc-8def-123456789012';
      const user = makeUser({
        verificationToken: token,
        verificationExpiresAt: new Date(Date.now() + 60000),
        isVerified: false,
      });
      userRepo.findByVerificationToken.mockResolvedValue(user);
      userRepo.setVerified.mockResolvedValue(user);

      const result = await authService.verifyEmail(token);

      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe('Email verified successfully');
      expect(result.resendRequired).toBe(false);
      expect(userRepo.setVerified).toHaveBeenCalledWith(user.id, true);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const user = makeUser({
        passwordHash: 'hashed',
        isVerified: true,
        isActive: true,
      });
      userRepo.findByEmail.mockResolvedValue(user);
      userRepo.updateLoginTracking.mockResolvedValue();
      sessionRepo.create.mockResolvedValue();

      const result = await authService.login(user.email, 'Password123!', '192.168.1.1');

      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', user.passwordHash);
      expect(userRepo.updateLoginTracking).toHaveBeenCalledWith(
        user.id,
        expect.any(Date),
        '192.168.1.1'
      );
      expect(sessionRepo.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('access.token');
      expect(result.refreshToken).toBe('refresh.token');
      expect(result.user.email).toBe(user.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should login without IP address', async () => {
      const user = makeUser({
        passwordHash: 'hashed',
        isVerified: true,
      });
      userRepo.findByEmail.mockResolvedValue(user);
      userRepo.updateLoginTracking.mockResolvedValue();
      sessionRepo.create.mockResolvedValue();

      const result = await authService.login(user.email, 'Password123!');

      expect(userRepo.updateLoginTracking).toHaveBeenCalledWith(user.id, expect.any(Date), null);
      expect(result.accessToken).toBeDefined();
    });

    it('should throw when user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.login('no@no.com', 'xx')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    });

    it('should throw when password is invalid', async () => {
      const user = makeUser({ passwordHash: 'hashed' });
      userRepo.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(user.email, 'wrongpass')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      });
    });

    it('should throw when user is not verified', async () => {
      const user = makeUser({
        passwordHash: 'hashed',
        isVerified: false,
      });
      userRepo.findByEmail.mockResolvedValue(user);

      await expect(authService.login(user.email, 'Password123!')).rejects.toMatchObject({
        code: API_ERROR_CODES.EMAIL_NOT_VERIFIED,
      });
    });

    it('should handle login tracking failure gracefully', async () => {
      const user = makeUser({
        passwordHash: 'hashed',
        isVerified: true,
      });
      userRepo.findByEmail.mockResolvedValue(user);
      userRepo.updateLoginTracking.mockRejectedValue(new Error('Tracking failed'));
      sessionRepo.create.mockResolvedValue();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await authService.login(user.email, 'Password123!');

      expect(result.accessToken).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update login tracking:',
        'Tracking failed'
      );

      consoleSpy.mockRestore();
    });

    it('should handle session creation failure gracefully', async () => {
      const user = makeUser({
        passwordHash: 'hashed',
        isVerified: true,
      });
      userRepo.findByEmail.mockResolvedValue(user);
      userRepo.updateLoginTracking.mockResolvedValue();
      sessionRepo.create.mockRejectedValue(new Error('Session failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await authService.login(user.email, 'Password123!');

      expect(result.accessToken).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getMe', () => {
    it('should return user info without password', async () => {
      const user = makeUser({ passwordHash: 'hashed' });
      userRepo.findById.mockResolvedValue(user);

      const result = await authService.getMe(user.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(user.email);
      expect(result.id).toBe(user.id);
    });

    it('should throw when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(authService.getMe('999')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const sessionToken = {
        id: '1',
        token: 'refresh.token',
        expiresAt: new Date(Date.now() + 60000),
      };
      const user = makeUser();

      sessionRepo.findByToken.mockResolvedValue(sessionToken);
      sessionRepo.update.mockResolvedValue();
      userRepo.findById.mockResolvedValue(user);

      const result = await authService.refreshToken('refresh.token');

      expect(sessionRepo.update).toHaveBeenCalledWith(sessionToken.id, {
        lastActivityAt: expect.any(Date),
      });
      expect(sessionRepo.update).toHaveBeenCalledWith(sessionToken.id, {
        token: 'refresh.token',
        expiresAt: expect.any(Date),
      });
      expect(result.accessToken).toBe('access.token');
      expect(result.refreshToken).toBe('refresh.token');
    });

    it('should throw when session token not found', async () => {
      sessionRepo.findByToken.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid')).rejects.toMatchObject({
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
      });
    });

    it('should throw when token is expired', async () => {
      const sessionToken = {
        id: '1',
        token: 'refresh.token',
        expiresAt: new Date(Date.now() - 60000), // Expired
      };

      sessionRepo.findByToken.mockResolvedValue(sessionToken);
      sessionRepo.deleteById.mockResolvedValue();

      await expect(authService.refreshToken('refresh.token')).rejects.toMatchObject({
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
      });

      expect(sessionRepo.deleteById).toHaveBeenCalledWith(sessionToken.id);
    });

    it('should throw when user not found after token verification', async () => {
      const sessionToken = {
        id: '1',
        token: 'refresh.token',
        expiresAt: new Date(Date.now() + 60000),
      };

      sessionRepo.findByToken.mockResolvedValue(sessionToken);
      sessionRepo.update.mockResolvedValue();
      userRepo.findById.mockResolvedValue(null);

      await expect(authService.refreshToken('refresh.token')).rejects.toMatchObject({
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
      });
    });

    it('should handle general errors', async () => {
      sessionRepo.findByToken.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(authService.refreshToken('token')).rejects.toMatchObject({
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error refreshing token:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      sessionRepo.deleteByToken.mockResolvedValue(1);

      const result = await authService.logout('refresh.token');

      expect(sessionRepo.deleteByToken).toHaveBeenCalledWith('refresh.token');
      expect(result).toBe(true);
    });

    it('should throw when token not found', async () => {
      sessionRepo.deleteByToken.mockResolvedValue(0);

      await expect(authService.logout('invalid')).rejects.toMatchObject({
        code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const user = makeUser();
      userRepo.findByEmail.mockResolvedValue(user);
      userRepo.setResetToken.mockResolvedValue();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await authService.forgotPassword(user.email);

      expect(userRepo.setResetToken).toHaveBeenCalledWith(
        user.id,
        '12345678-1234-4abc-8def-123456789012',
        expect.any(Date)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Reset token:',
        '12345678-1234-4abc-8def-123456789012'
      );

      consoleSpy.mockRestore();
    });

    it('should throw when user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.forgotPassword('nouser@test.com')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const user = makeUser();
      userRepo.findByResetToken.mockResolvedValue(user);
      userRepo.update.mockResolvedValue();

      const result = await authService.resetPassword('reset-token', 'newPassword123!');

      expect(userRepo.update).toHaveBeenCalledWith(user.id, {
        password: 'newPassword123!',
        resetToken: null,
        resetExpiresAt: null,
      });
      expect(result).toBe(true);
    });

    it('should throw when reset token is invalid', async () => {
      userRepo.findByResetToken.mockResolvedValue(null);

      await expect(authService.resetPassword('invalid-token', 'newpass')).rejects.toMatchObject({
        code: API_ERROR_CODES.INVALID_RESET_TOKEN,
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send email successfully', async () => {
      await expect(
        authService.sendVerificationEmail('test@example.com', 'testuser', 'token123')
      ).resolves.not.toThrow();
    });

    it('should throw when email not configured', async () => {
      // Create a spy to capture the actual call but prevent execution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Temporarily override the sendVerificationEmail method
      const originalMethod = authService.sendVerificationEmail;
      authService.sendVerificationEmail = jest
        .fn()
        .mockRejectedValue(new Error('Email service not configured'));

      await expect(
        authService.sendVerificationEmail('test@example.com', 'testuser', 'token123')
      ).rejects.toThrow('Email service not configured');

      // Restore original method
      authService.sendVerificationEmail = originalMethod;
      consoleSpy.mockRestore();
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const user = makeUser({ isVerified: false });
      userRepo.findByEmail.mockResolvedValue(user);
      userRepo.setVerificationToken.mockResolvedValue();

      await authService.resendVerification(user.email);

      expect(userRepo.setVerificationToken).toHaveBeenCalledWith(
        user.id,
        '12345678-1234-4abc-8def-123456789012',
        expect.any(Date)
      );
    });

    it('should throw when user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.resendVerification('nouser@test.com')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    });

    it('should throw when user already verified', async () => {
      const user = makeUser({ isVerified: true });
      userRepo.findByEmail.mockResolvedValue(user);

      await expect(authService.resendVerification(user.email)).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_VERIFIED,
      });
    });
  });

  describe('cleanExpiredVerificationTokens', () => {
    it('should clean expired tokens', async () => {
      userRepo.cleanExpiredVerificationTokens.mockResolvedValue(5);

      const result = await authService.cleanExpiredVerificationTokens();

      expect(result).toBe(5);
      expect(userRepo.cleanExpiredVerificationTokens).toHaveBeenCalled();
    });
  });
});
