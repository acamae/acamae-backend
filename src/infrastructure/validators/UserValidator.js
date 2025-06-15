import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';
import { validationSchemas } from '../middleware/validation.js';

/**
 * Validator for user-specific business rules
 */
export class UserValidator {
  /**
   * Validate user creation data
   * @param {import('../../application/dtos/UserDto').CreateUserDto} data - User data
   * @throws {Error} If validation fails
   */
  static validateCreate(data) {
    // First validate basic structure with Zod schema
    validationSchemas.register.parse(data);

    // Then apply business-specific validations
    if (data.firstName && data.lastName) {
      this._validateNameCombination(data.firstName, data.lastName);
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
  static validateUpdate(data) {
    // First validate basic structure with Zod schema
    validationSchemas.updateUser.parse(data);

    // Then apply business-specific validations
    if (data.firstName && data.lastName) {
      this._validateNameCombination(data.firstName, data.lastName);
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
      throw createError('Verification token is required', API_ERROR_CODES.VALIDATION_ERROR);
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
      throw createError('Reset token is required', API_ERROR_CODES.VALIDATION_ERROR);
    }

    if (!data.newPassword) {
      throw createError('New password is required', API_ERROR_CODES.VALIDATION_ERROR);
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
  static _validateNameCombination(firstName, lastName) {
    // Example: Check if the combination of first and last name is not in a blacklist
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    if (this.isBlacklistedName(fullName)) {
      throw createError('This name combination is not allowed', API_ERROR_CODES.VALIDATION_ERROR);
    }
  }

  static _validateRoleAssignment(role) {
    // Example: Check if the role assignment follows business rules
    if (role === 'admin' && !this.hasAdminPrivileges()) {
      throw createError('Insufficient privileges to assign admin role', API_ERROR_CODES.FORBIDDEN);
    }
  }

  static _validateLoginAttempts(email) {
    // Example: Check if there have been too many failed login attempts
    if (this.hasTooManyFailedAttempts(email)) {
      throw createError('Too many failed login attempts', API_ERROR_CODES.TOO_MANY_REQUESTS);
    }
  }

  static _validateTokenExpiration(token) {
    // Example: Check if the token has expired
    if (this.isTokenExpired(token)) {
      throw createError('Token has expired', API_ERROR_CODES.TOKEN_EXPIRED);
    }
  }

  static _validatePasswordResetAttempts(email) {
    // Example: Check if there have been too many password reset requests
    if (this.hasTooManyResetAttempts(email)) {
      throw createError('Too many password reset attempts', API_ERROR_CODES.TOO_MANY_REQUESTS);
    }
  }

  static _validatePasswordHistory(newPassword) {
    // Example: Check if the new password hasn't been used recently
    if (this.isPasswordInHistory(newPassword)) {
      throw createError('Password has been used recently', API_ERROR_CODES.VALIDATION_ERROR);
    }
  }

  static _validateRoleFilter(role) {
    // Example: Check if the role filter is valid for the current user's permissions
    if (!this.canFilterByRole(role)) {
      throw createError('Invalid role filter', API_ERROR_CODES.FORBIDDEN);
    }
  }
}
