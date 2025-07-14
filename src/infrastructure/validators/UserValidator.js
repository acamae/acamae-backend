import { nameModerationService } from '../../application/services/NameModerationService.js';
import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';
import { validationSchemas } from '../middleware/validation.js';

/**
 * Validator for user-specific business rules
 *
 * Note: The expiry token is handled by the auth middleware (see src/infrastructure/middleware/auth.js).
 */
export class UserValidator {
  /**
   * Validate user creation data
   * @param {import('../../application/dtos/UserDto').CreateUserDto} data - User data
   * @throws {Error} If validation fails
   */
  static async validateCreate(data) {
    // First validate basic structure with Zod schema
    validationSchemas.register.parse(data);

    if (data.username) {
      await this._validateUsername(data.username);
    }

    // Then apply business-specific validations
    if (data.firstName && data.lastName) {
      await this._validateNameCombination(data.firstName, data.lastName);
    }

    if (data.role) {
      this._validateRoleAssignment(data.role);
    }
  }

  /**
   * Validate user update data
   * @param {import('../../application/dtos/UserDto').UpdateUserDto} data - User data
   * @throws {Error} If validation fails
   */
  static async validateUpdate(data) {
    // First validate basic structure with Zod schema
    validationSchemas.updateUser.parse(data);

    // Then apply business-specific validations
    if (data.firstName && data.lastName) {
      await this._validateNameCombination(data.firstName, data.lastName);
    }

    if (data.role) {
      this._validateRoleAssignment(data.role);
    }
  }

  /**
   * Validate user authentication data
   * @param {import('../../application/dtos/UserDto').UserAuthDto} data - Authentication data
   * @throws {Error} If validation fails
   */
  static validateAuth(data) {
    // First validate basic structure with Zod schema
    validationSchemas.login.parse(data);

    // Then apply business-specific validations
    this._validateLoginAttempts(data.email);
  }

  /**
   * Validate user verification data
   * @param {import('../../application/dtos/UserDto').UserVerificationDto} data - Verification data
   * @throws {Error} If validation fails
   */
  static validateVerification(data) {
    if (!data.token) {
      throw createError({
        message: 'Verification token is required',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            { field: 'token', code: 'REQUIRED', message: 'Verification token is required' },
          ],
        },
      });
    }
    this._validateTokenExpiration(data.token);
  }

  /**
   * Validate user password reset request data
   * @param {import('../../application/dtos/UserDto').UserPasswordResetRequestDto} data - Reset request data
   * @throws {Error} If validation fails
   */
  static validatePasswordResetRequest(data) {
    // First validate basic structure with Zod schema
    validationSchemas.login.parse({ email: data.email, password: 'dummy' });

    // Then apply business-specific validations
    this._validatePasswordResetAttempts(data.email);
  }

  /**
   * Validate user password reset data
   * @param {import('../../application/dtos/UserDto').UserPasswordResetDto} data - Reset data
   * @throws {Error} If validation fails
   */
  static validatePasswordReset(data) {
    if (!data.token) {
      throw createError({
        message: 'Reset token is required',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [{ field: 'token', code: 'REQUIRED', message: 'Reset token is required' }],
        },
      });
    }

    if (!data.newPassword) {
      throw createError({
        message: 'New password is required',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            { field: 'newPassword', code: 'REQUIRED', message: 'New password is required' },
          ],
        },
      });
    }

    // First validate basic structure with Zod schema
    validationSchemas.register.parse({
      email: 'dummy@example.com',
      password: data.newPassword,
      username: 'dummy',
    });

    // Then apply business-specific validations
    this._validateTokenExpiration(data.token);
    this._validatePasswordHistory(data.newPassword);
  }

  /**
   * Validate user pagination data
   * @param {import('../../application/dtos/UserDto').UserPaginationDto} data - Pagination data
   * @throws {Error} If validation fails
   */
  static validatePagination(data) {
    // First validate basic structure with Zod schema
    validationSchemas.pagination.parse(data);

    // Then apply business-specific validations
    if (data.filters?.role) {
      this._validateRoleFilter(data.filters.role);
    }
  }

  // Private helper methods for business-specific validations

  /**
   * Check if a name is in the blacklist using AI moderation
   * @param {string} fullName - Full name to check
   * @returns {Promise<boolean>} - True if name is blacklisted
   */
  static async isBlacklistedName(fullName) {
    return await nameModerationService.isInappropriateName(fullName);
  }

  // @TODO: Verify if the user has admin privileges
  static hasAdminPrivileges() {
    // Implement admin privileges verification
    throw new Error('Not implemented');
  }

  // @TODO: Verify if there are too many failed login attempts
  static hasTooManyFailedAttempts(email) {
    // Implement failed login attempts control
    throw new Error('Not implemented');
  }

  // @TODO: Verify if there are too many password reset attempts
  static hasTooManyResetAttempts(email) {
    // Implement password reset attempts control
    throw new Error('Not implemented');
  }

  // @TODO: Verify if the password has been used recently
  static isPasswordInHistory(newPassword) {
    // Implement password history
    throw new Error('Not implemented');
  }

  // @TODO: Verify if the user can filter by the given role
  static canFilterByRole(role) {
    // Implement role filter permissions control
    throw new Error('Not implemented');
  }

  /**
   * Wrapper - validate name combination using AI moderation
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @throws {Error} If name combination is inappropriate
   */
  static async _validateUsername(username) {
    const isInappropriate = await this.isBlacklistedName(username);

    if (isInappropriate) {
      throw createError({
        message: 'This username is not allowed',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            { field: 'username', code: 'INVALID', message: 'This username is not allowed' },
          ],
        },
      });
    }
  }

  /**
   * Wrapper - validate name combination using AI moderation
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @throws {Error} If name combination is inappropriate
   */
  static async _validateNameCombination(firstName, lastName) {
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const isInappropriate = await this.isBlacklistedName(fullName);

    if (isInappropriate) {
      throw createError({
        message: 'This name combination is not allowed',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            { field: 'name', code: 'INVALID', message: 'This name combination is not allowed' },
          ],
        },
      });
    }
  }

  // @TODO: Wrapper - validate admin role assignment
  static _validateRoleAssignment(role) {
    if (role === 'admin' && !this.hasAdminPrivileges()) {
      throw createError({
        message: 'Insufficient privileges to assign admin role',
        code: API_ERROR_CODES.AUTH_FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'role',
              code: 'INVALID',
              message: 'Insufficient privileges to assign admin role',
            },
          ],
        },
      });
    }
  }

  // @TODO: Wrapper - validate failed login attempts
  static _validateLoginAttempts(email) {
    if (this.hasTooManyFailedAttempts(email)) {
      throw createError({
        message: 'Too many failed login attempts',
        code: API_ERROR_CODES.TOO_MANY_REQUESTS,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'login',
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many failed login attempts',
            },
          ],
        },
      });
    }
  }

  // @TODO: Wrapper - validate password reset attempts
  static _validatePasswordResetAttempts(email) {
    if (this.hasTooManyResetAttempts(email)) {
      throw createError({
        message: 'Too many password reset attempts',
        code: API_ERROR_CODES.TOO_MANY_REQUESTS,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'reset',
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many password reset attempts',
            },
          ],
        },
      });
    }
  }

  // @TODO: Wrapper - validate password history
  static _validatePasswordHistory(newPassword) {
    if (this.isPasswordInHistory(newPassword)) {
      throw createError({
        message: 'Password has been used recently',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            { field: 'password', code: 'INVALID', message: 'Password has been used recently' },
          ],
        },
      });
    }
  }

  // @TODO: Wrapper - validate role filter
  static _validateRoleFilter(role) {
    if (!this.canFilterByRole(role)) {
      throw createError({
        message: 'Invalid role filter',
        code: API_ERROR_CODES.AUTH_FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
        errorDetails: {
          type: 'business',
          details: [{ field: 'role', code: 'INVALID', message: 'Invalid role filter' }],
        },
      });
    }
  }
}
