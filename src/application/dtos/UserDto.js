/**
 * Data Transfer Objects for User operations
 */

/**
 * @typedef {Object} CreateUserDto
 * @property {string} username - Username
 * @property {string} email - Email
 * @property {string} password - Password
 * @property {string} [firstName] - First name
 * @property {string} [lastName] - Last name
 * @property {string} [role='user'] - User role
 * @property {boolean} [isActive] - Profile is active (default: true)
 * @property {Date} [lastLoginAt] - Last login timestamp
 * @property {string} [lastLoginIp] - Last login IP address
 */
export const CreateUserDto = {};

/**
 * @typedef {Object} UpdateUserDto
 * @property {string} [username] - Username
 * @property {string} [email] - Email
 * @property {string} [password] - Password
 * @property {string} [firstName] - First name
 * @property {string} [lastName] - Last name
 * @property {string} [role] - User role
 * @property {boolean} [isVerified] - Whether the user is verified
 * @property {boolean} [isActive] - Profile is active and renewed
 * @property {Date} [lastLoginAt] - Last login timestamp
 * @property {string} [lastLoginIp] - Last login IP address
 */
export const UpdateUserDto = {};

/**
 * @typedef {Object} UserResponseDto
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email
 * @property {string} [firstName] - First name
 * @property {string} [lastName] - Last name
 * @property {string} role - User role
 * @property {boolean} isVerified - Whether the user is verified
 * @property {boolean} isActive - Profile is active and renewed
 * @property {Date} [lastLoginAt] - Last login timestamp
 * @property {string} [lastLoginIp] - Last login IP address (sensitive, only for admin)
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */
export const UserResponseDto = {};

/**
 * @typedef {Object} UserListResponseDto
 * @property {UserResponseDto[]} data - List of users
 * @property {number} total - Total number of users
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 */
export const UserListResponseDto = {};

/**
 * @typedef {Object} UserFiltersDto
 * @property {string} [search] - Search term
 * @property {string} [role] - Role filter
 * @property {boolean} [isVerified] - Verification status filter
 */
export const UserFiltersDto = {};

/**
 * @typedef {Object} UserPaginationDto
 * @property {number} [page=1] - Page number
 * @property {number} [limit=10] - Items per page
 * @property {UserFiltersDto} [filters] - Filter criteria
 */
export const UserPaginationDto = {};

/**
 * @typedef {Object} UserAuthDto
 * @property {string} email - Email
 * @property {string} password - Password
 */
export const UserAuthDto = {};

/**
 * @typedef {Object} UserAuthResponseDto
 * @property {UserResponseDto} user - User data
 * @property {string} accessToken - JWT access token
 * @property {string} refreshToken - JWT refresh token
 */
export const UserAuthResponseDto = {};

/**
 * @typedef {Object} UserVerificationDto
 * @property {string} token - Verification token
 */
export const UserVerificationDto = {};

/**
 * @typedef {Object} UserPasswordResetRequestDto
 * @property {string} email - User email
 */
export const UserPasswordResetRequestDto = {};

/**
 * @typedef {Object} UserPasswordResetDto
 * @property {string} token - Reset token
 * @property {string} newPassword - New password
 */
export const UserPasswordResetDto = {};
