import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
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
  // @TODO: Verifica si el nombre completo está en una lista negra
  static isBlacklistedName(fullName) {
    // Implementar lógica de blacklist de nombres
    throw new Error('Not implemented');
  }

  // @TODO: Verifica si el usuario tiene privilegios de admin
  static hasAdminPrivileges() {
    // Implementar verificación de privilegios admin
    throw new Error('Not implemented');
  }

  // @TODO: Verifica si hay demasiados intentos fallidos de login
  static hasTooManyFailedAttempts(email) {
    // Implementar control de intentos fallidos
    throw new Error('Not implemented');
  }

  // @TODO: Verifica si hay demasiados intentos de reseteo de contraseña
  static hasTooManyResetAttempts(email) {
    // Implementar control de reseteos de contraseña
    throw new Error('Not implemented');
  }

  // @TODO: Verifica si la contraseña ya fue usada recientemente
  static isPasswordInHistory(newPassword) {
    // Implementar historial de contraseñas
    throw new Error('Not implemented');
  }

  // @TODO: Verifica si el usuario puede filtrar por el rol dado
  static canFilterByRole(role) {
    // Implementar control de permisos de filtrado por rol
    throw new Error('Not implemented');
  }

  // @TODO: Wrapper - valida combinación de nombres usando blacklist
  static _validateNameCombination(firstName, lastName) {
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    if (this.isBlacklistedName(fullName)) {
      throw createError('This name combination is not allowed', API_ERROR_CODES.VALIDATION_ERROR);
    }
  }

  // @TODO: Wrapper - valida asignación de rol admin
  static _validateRoleAssignment(role) {
    if (role === 'admin' && !this.hasAdminPrivileges()) {
      throw createError(
        'Insufficient privileges to assign admin role',
        API_ERROR_CODES.AUTH_FORBIDDEN
      );
    }
  }

  // @TODO: Wrapper - valida intentos fallidos de login
  static _validateLoginAttempts(email) {
    if (this.hasTooManyFailedAttempts(email)) {
      throw createError('Too many failed login attempts', API_ERROR_CODES.TOO_MANY_REQUESTS);
    }
  }

  // @TODO: Wrapper - valida intentos de reseteo de contraseña
  static _validatePasswordResetAttempts(email) {
    if (this.hasTooManyResetAttempts(email)) {
      throw createError('Too many password reset attempts', API_ERROR_CODES.TOO_MANY_REQUESTS);
    }
  }

  // @TODO: Wrapper - valida historial de contraseñas
  static _validatePasswordHistory(newPassword) {
    if (this.isPasswordInHistory(newPassword)) {
      throw createError('Password has been used recently', API_ERROR_CODES.VALIDATION_ERROR);
    }
  }

  // @TODO: Wrapper - valida permisos de filtrado por rol
  static _validateRoleFilter(role) {
    if (!this.canFilterByRole(role)) {
      throw createError('Invalid role filter', API_ERROR_CODES.AUTH_FORBIDDEN);
    }
  }
}
