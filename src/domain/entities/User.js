import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import {
  ERROR_MESSAGES,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  REGEX,
  USER_ROLES,
} from '../../shared/constants/validation.js';
import { createError } from '../../shared/utils/error.js';

/**
 * @typedef {Object} User
 * @property {string} id - Unique user ID
 * @property {string} email - User email
 * @property {string} username - User username
 * @property {string} passwordHash - User password hash
 * @property {string} role - User role
 * @property {boolean} isVerified - Verification status
 * @property {boolean} isActive - Profile is active and renewed
 * @property {Date} [lastLoginAt] - Last login timestamp
 * @property {string} [lastLoginIp] - Last login IP address
 * @property {string} [verificationToken] - Verification token
 * @property {Date} [verificationExpiresAt] - Verification token expiration date
 * @property {string} [resetToken] - Reset token
 * @property {Date} [resetExpiresAt] - Reset token expiration date
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} CreateUserDto
 * @property {string} email - User email
 * @property {string} username - User username
 * @property {string} password - User password
 * @property {string} [role] - User role
 * @property {boolean} [isActive] - Profile is active (default: true)
 * @property {Date} [lastLoginAt] - Last login timestamp
 * @property {string} [lastLoginIp] - Last login IP address
 */

/**
 * @typedef {Object} UpdateUserDto
 * @property {string} [email] - User email
 * @property {string} [username] - User username
 * @property {string} [password] - User password
 * @property {string} [role] - User role
 * @property {boolean} [isVerified] - Verification status
 * @property {boolean} [isActive] - Profile is active and renewed
 * @property {Date} [lastLoginAt] - Last login timestamp
 * @property {string} [lastLoginIp] - Last login IP address
 */

/**
 * User entity
 * @class
 */
export class User {
  /**
   * Create a new User instance
   * @param {Object} data - User data
   * @param {number} [data.id] - User ID
   * @param {string} data.username - Username
   * @param {string} data.email - Email
   * @param {string} data.password - Password
   * @param {string} [data.firstName] - First name
   * @param {string} [data.lastName] - Last name
   * @param {string} [data.role='user'] - User role
   * @param {boolean} [data.isVerified=false] - Whether the user is verified
   * @param {boolean} [data.isActive=true] - Whether the profile is active
   * @param {Date} [data.lastLoginAt] - Last login timestamp
   * @param {string} [data.lastLoginIp] - Last login IP address
   * @param {string} [data.verificationToken] - Verification token
   * @param {Date} [data.verificationExpiresAt] - Verification token expiration
   * @param {string} [data.resetToken] - Password reset token
   * @param {Date} [data.resetExpiresAt] - Reset token expiration
   * @param {Date} [data.createdAt] - Creation date
   * @param {Date} [data.updatedAt] - Last update date
   */
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || USER_ROLES.USER;
    this.isVerified = data.isVerified || false;
    this.isActive = data.isActive || true;
    this.lastLoginAt = data.lastLoginAt;
    this.lastLoginIp = data.lastLoginIp;
    this.verificationToken = data.verificationToken;
    this.verificationExpiresAt = data.verificationExpiresAt;
    this.resetToken = data.resetToken;
    this.resetExpiresAt = data.resetExpiresAt;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    this.validate();
  }

  /**
   * Validate user data
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.username) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
        code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'username',
              code: 'REQUIRED',
              message: 'Username is required',
            },
          ],
        },
      });
    }

    if (this.username.length < MIN_USERNAME_LENGTH || this.username.length > MAX_USERNAME_LENGTH) {
      throw createError({
        message: `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`,
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'username',
              code: 'INVALID_FORMAT',
              message: `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`,
            },
          ],
        },
      });
    }

    if (!this.email) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
        code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'email',
              code: 'REQUIRED',
              message: 'Email is required',
            },
          ],
        },
      });
    }

    if (!REGEX.EMAIL.test(this.email)) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.INVALID_FORMAT],
        code: API_ERROR_CODES.INVALID_FORMAT,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'email',
              code: 'INVALID_FORMAT',
              message: 'Email is not valid',
            },
          ],
        },
      });
    }

    if (this.email.length > MAX_EMAIL_LENGTH) {
      throw createError({
        message: `Email must not exceed ${MAX_EMAIL_LENGTH} characters`,
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'email',
              code: 'INVALID_FORMAT',
              message: `Email must not exceed ${MAX_EMAIL_LENGTH} characters`,
            },
          ],
        },
      });
    }

    if (this.firstName && this.firstName.length > MAX_NAME_LENGTH) {
      throw createError({
        message: `First name must not exceed ${MAX_NAME_LENGTH} characters`,
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'firstName',
              code: 'INVALID_FORMAT',
              message: `First name must not exceed ${MAX_NAME_LENGTH} characters`,
            },
          ],
        },
      });
    }

    if (this.lastName && this.lastName.length > MAX_NAME_LENGTH) {
      throw createError({
        message: `Last name must not exceed ${MAX_NAME_LENGTH} characters`,
        code: API_ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'lastName',
              code: 'INVALID_FORMAT',
              message: `Last name must not exceed ${MAX_NAME_LENGTH} characters`,
            },
          ],
        },
      });
    }

    if (!Object.values(USER_ROLES).includes(this.role)) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.INVALID_ROLE],
        code: API_ERROR_CODES.INVALID_ROLE,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'role',
              code: 'INVALID_FORMAT',
              message: 'Role is not valid',
            },
          ],
        },
      });
    }
  }

  /**
   * Get user's full name
   * @returns {string} Full name
   */
  getFullName() {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.username;
  }

  /**
   * Check if user is admin
   * @returns {boolean} Whether user is admin
   */
  isAdmin() {
    return this.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if user is manager
   * @returns {boolean} Whether user is manager
   */
  isManager() {
    return this.role === USER_ROLES.MANAGER;
  }

  /**
   * Check if user is manager or admin
   * @returns {boolean} Whether user is manager or admin
   */
  isManagerOrAdmin() {
    return this.isManager() || this.isAdmin();
  }

  /**
   * Check if verification token is valid
   * @returns {boolean} Whether verification token is valid
   */
  hasValidVerificationToken() {
    return (
      this.verificationToken &&
      this.verificationExpiresAt &&
      this.verificationExpiresAt > new Date()
    );
  }

  /**
   * Check if reset token is valid
   * @returns {boolean} Whether reset token is valid
   */
  hasValidResetToken() {
    return this.resetToken && this.resetExpiresAt && this.resetExpiresAt > new Date();
  }

  /**
   * Convert user to plain object
   * @param {boolean} [includeSensitive=false] - Whether to include sensitive data
   * @returns {Object} Plain object
   */
  toJSON(includeSensitive = false) {
    const obj = {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isVerified: this.isVerified,
      isActive: this.isActive,
      lastLoginAt: this.lastLoginAt,
      lastLoginIp: this.lastLoginIp,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (includeSensitive) {
      obj.verificationToken = this.verificationToken;
      obj.verificationExpiresAt = this.verificationExpiresAt;
      obj.resetToken = this.resetToken;
      obj.resetExpiresAt = this.resetExpiresAt;
    }

    return obj;
  }
}
