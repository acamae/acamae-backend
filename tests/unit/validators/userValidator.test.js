import { UserValidator } from '../../../src/infrastructure/validators/UserValidator.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';

// Mock the NameModerationService
jest.mock('../../../src/application/services/NameModerationService.js', () => ({
  nameModerationService: {
    isInappropriateName: jest.fn(() => Promise.resolve(false)),
  },
}));

// Mock the actual validation middleware to return proper results
jest.mock('../../../src/infrastructure/middleware/validation.js', () => ({
  validationSchemas: {
    register: {
      parse: jest.fn((data) => {
        // Simulate basic validation - throw if missing required fields
        if (!data.email || !data.password || !data.username) {
          const error = new Error('Validation failed');
          error.issues = [{ path: ['email'], message: 'Required' }];
          throw error;
        }
        return data;
      }),
    },
    updateUser: { parse: jest.fn((data) => data) },
    login: {
      parse: jest.fn((data) => {
        if (!data.email || !data.password) {
          const error = new Error('Validation failed');
          error.issues = [{ path: ['email'], message: 'Required' }];
          throw error;
        }
        return data;
      }),
    },
    pagination: { parse: jest.fn((data) => data) },
  },
}));

// Helper to reset dynamic method stubs
const resetMethodStubs = () => {
  UserValidator.hasAdminPrivileges = jest.fn(() => true);
  UserValidator.hasTooManyFailedAttempts = jest.fn(() => false);
  UserValidator.hasTooManyResetAttempts = jest.fn(() => false);
  UserValidator.isPasswordInHistory = jest.fn(() => false);
  UserValidator.canFilterByRole = jest.fn(() => true);
  UserValidator._validateTokenExpiration = jest.fn();
  // Mock _validateUsername para que no lance error por defecto
  UserValidator._validateUsername = jest.fn(() => Promise.resolve());
};

describe('UserValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMethodStubs();
  });

  describe('validateCreate', () => {
    it('should validate correct user creation data', async () => {
      await expect(
        UserValidator.validateCreate({
          email: 'user@example.com',
          password: 'Password123!',
          username: 'validuser',
        })
      ).resolves.not.toThrow();
    });

    it('should reject user creation with blacklisted name', async () => {
      // Mock the name moderation service to return true (inappropriate)
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(true);

      await expect(
        UserValidator.validateCreate({
          email: 'user@example.com',
          password: 'Password123!',
          username: 'validuser',
          firstName: 'Banned',
          lastName: 'Name',
        })
      ).rejects.toThrow(expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR }));
    });

    it('should reject admin role creation without proper privileges', async () => {
      UserValidator.hasAdminPrivileges.mockReturnValue(false);

      await expect(
        UserValidator.validateCreate({
          email: 'user@example.com',
          password: 'Password123!',
          username: 'validuser',
          role: 'admin',
        })
      ).rejects.toThrow(expect.objectContaining({ code: API_ERROR_CODES.AUTH_FORBIDDEN }));
    });

    it('should validate user with firstName only', async () => {
      await expect(
        UserValidator.validateCreate({
          email: 'user@example.com',
          password: 'Password123!',
          username: 'validuser',
          firstName: 'John',
        })
      ).resolves.not.toThrow();
    });

    it('should validate user with lastName only', async () => {
      await expect(
        UserValidator.validateCreate({
          email: 'user@example.com',
          password: 'Password123!',
          username: 'validuser',
          lastName: 'Doe',
        })
      ).resolves.not.toThrow();
    });

    it('should validate user with role but not admin', async () => {
      await expect(
        UserValidator.validateCreate({
          email: 'user@example.com',
          password: 'Password123!',
          username: 'validuser',
          role: 'user',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('validateUpdate', () => {
    it('should validate correct user update data', async () => {
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(false);
      await expect(
        UserValidator.validateUpdate({
          firstName: 'John',
          lastName: 'Doe',
        })
      ).resolves.not.toThrow();
    });

    it('should reject blacklisted name in update', async () => {
      // Mock the name moderation service to return true (inappropriate)
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(true);

      await expect(
        UserValidator.validateUpdate({
          firstName: 'Banned',
          lastName: 'Name',
        })
      ).rejects.toThrow(expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR }));
    });

    it('should reject admin role update without privileges', async () => {
      UserValidator.hasAdminPrivileges.mockReturnValue(false);

      await expect(
        UserValidator.validateUpdate({
          role: 'admin',
        })
      ).rejects.toThrow(expect.objectContaining({ code: API_ERROR_CODES.AUTH_FORBIDDEN }));
    });

    it('should validate update without name combination', async () => {
      await expect(
        UserValidator.validateUpdate({
          email: 'newemail@example.com',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('validateAuth', () => {
    it('should validate correct authentication data', () => {
      expect(() =>
        UserValidator.validateAuth({
          email: 'user@example.com',
          password: 'password123',
        })
      ).not.toThrow();
    });

    it('should reject authentication with too many failed attempts', () => {
      UserValidator.hasTooManyFailedAttempts.mockReturnValue(true);

      expect(() =>
        UserValidator.validateAuth({ email: 'user@example.com', password: 'pass' })
      ).toThrow(expect.objectContaining({ code: API_ERROR_CODES.TOO_MANY_REQUESTS }));
    });
  });

  describe('validateVerification', () => {
    it('should require token for email verification', () => {
      expect(() => UserValidator.validateVerification({})).toThrow(
        expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR })
      );
    });

    it('should validate correct verification token', () => {
      expect(() => UserValidator.validateVerification({ token: 'valid-token' })).not.toThrow();
    });
  });

  describe('validatePasswordResetRequest', () => {
    it('should validate correct password reset request', () => {
      expect(() =>
        UserValidator.validatePasswordResetRequest({ email: 'user@example.com' })
      ).not.toThrow();
    });

    it('should reject password reset with too many attempts', () => {
      UserValidator.hasTooManyResetAttempts.mockReturnValue(true);

      expect(() =>
        UserValidator.validatePasswordResetRequest({ email: 'user@example.com' })
      ).toThrow(expect.objectContaining({ code: API_ERROR_CODES.TOO_MANY_REQUESTS }));
    });
  });

  describe('validatePasswordReset', () => {
    it('should require token for password reset', () => {
      expect(() =>
        UserValidator.validatePasswordReset({
          newPassword: 'NewPassword123!',
        })
      ).toThrow(expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR }));
    });

    it('should require new password for password reset', () => {
      expect(() =>
        UserValidator.validatePasswordReset({
          token: 'valid-token',
        })
      ).toThrow(expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR }));
    });

    it('should validate correct password reset data', () => {
      expect(() =>
        UserValidator.validatePasswordReset({
          token: 'valid-token',
          newPassword: 'NewPassword123!',
        })
      ).not.toThrow();
    });

    it('should reject password reset with used password', () => {
      UserValidator.isPasswordInHistory.mockReturnValue(true);

      expect(() =>
        UserValidator.validatePasswordReset({
          token: 'valid-token',
          newPassword: 'UsedPassword123!',
        })
      ).toThrow(expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR }));
    });
  });

  describe('validatePagination', () => {
    it('should validate correct pagination data', () => {
      expect(() =>
        UserValidator.validatePagination({
          page: 1,
          limit: 10,
        })
      ).not.toThrow();
    });

    it('should validate pagination with role filter', () => {
      expect(() =>
        UserValidator.validatePagination({
          page: 1,
          limit: 10,
          filters: { role: 'user' },
        })
      ).not.toThrow();
    });

    it('should reject pagination with invalid role filter', () => {
      UserValidator.canFilterByRole.mockReturnValue(false);

      expect(() =>
        UserValidator.validatePagination({
          page: 1,
          limit: 10,
          filters: { role: 'invalid' },
        })
      ).toThrow(expect.objectContaining({ code: API_ERROR_CODES.AUTH_FORBIDDEN }));
    });
  });

  describe('isBlacklistedName', () => {
    it('should return false for appropriate names', async () => {
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(false);
      const result = await UserValidator.isBlacklistedName('John Doe');
      expect(result).toBe(false);
    });

    it('should return true for inappropriate names', async () => {
      // Mock the name moderation service to return true (inappropriate)
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(true);

      const result = await UserValidator.isBlacklistedName('Inappropriate Name');
      expect(result).toBe(true);
    });
  });

  describe('_validateNameCombination', () => {
    it('should not throw for appropriate names', async () => {
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(false);
      await expect(UserValidator._validateNameCombination('John', 'Doe')).resolves.not.toThrow();
    });

    it('should throw for inappropriate names', async () => {
      // Mock the name moderation service to return true (inappropriate)
      const {
        nameModerationService,
      } = require('../../../src/application/services/NameModerationService.js');
      nameModerationService.isInappropriateName.mockResolvedValue(true);

      await expect(UserValidator._validateNameCombination('Banned', 'Name')).rejects.toThrow(
        expect.objectContaining({ code: API_ERROR_CODES.VALIDATION_ERROR })
      );
    });
  });
});
