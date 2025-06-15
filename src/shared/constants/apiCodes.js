import {
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_EMAIL_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PAGE_SIZE,
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MIN_TEAM_TAG_LENGTH,
  MAX_TEAM_TAG_LENGTH,
  MAX_TEAM_DESCRIPTION_LENGTH,
} from './validation.js';

/**
 * API response codes
 * @typedef {Object} ApiCodes
 */

/**
 * API error codes
 */
export const API_ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_VALUE: 'INVALID_VALUE',
  INVALID_JSON: 'INVALID_JSON',
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  INVALID_VERIFICATION_TOKEN: 'INVALID_VERIFICATION_TOKEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_ROLE: 'INVALID_ROLE',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  CORS_ERROR: 'CORS_ERROR',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',

  // Rate limiting errors (429)
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
};

/**
 * Códigos de éxito de la API
 */
export const API_SUCCESS_CODES = {
  SUCCESS: 'SUCCESS',
};

/**
 * Error messages
 * Centralized error messages for the entire application
 */
export const ERROR_MESSAGES = {
  // API Error Messages
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [API_ERROR_CODES.INVALID_INPUT]: 'Invalid input',
  [API_ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [API_ERROR_CODES.INVALID_FORMAT]: 'Invalid format',
  [API_ERROR_CODES.INVALID_LENGTH]: 'Invalid length',
  [API_ERROR_CODES.INVALID_VALUE]: 'Invalid value',
  [API_ERROR_CODES.INVALID_JSON]: 'Invalid JSON',
  [API_ERROR_CODES.REQUEST_TOO_LARGE]: 'Request entity too large',
  [API_ERROR_CODES.UNAUTHORIZED]: 'Unauthorized',
  [API_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials',
  [API_ERROR_CODES.INVALID_TOKEN]: 'Invalid token',
  [API_ERROR_CODES.TOKEN_EXPIRED]: 'Token expired',
  [API_ERROR_CODES.INVALID_REFRESH_TOKEN]: 'Invalid refresh token',
  [API_ERROR_CODES.INVALID_RESET_TOKEN]: 'Invalid reset token',
  [API_ERROR_CODES.INVALID_VERIFICATION_TOKEN]: 'Invalid verification token',
  [API_ERROR_CODES.EMAIL_NOT_VERIFIED]: 'Email not verified',
  [API_ERROR_CODES.INVALID_ROLE]: 'Invalid role',
  [API_ERROR_CODES.FORBIDDEN]: 'Forbidden',
  [API_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [API_ERROR_CODES.ROLE_REQUIRED]: 'Role required',
  [API_ERROR_CODES.CORS_ERROR]: 'CORS error',
  [API_ERROR_CODES.NOT_FOUND]: 'Not found',
  [API_ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
  [API_ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [API_ERROR_CODES.TEAM_NOT_FOUND]: 'Team not found',
  [API_ERROR_CODES.CONFLICT]: 'Conflict',
  [API_ERROR_CODES.DUPLICATE_ENTRY]: 'Duplicate entry',
  [API_ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'Email already exists',
  [API_ERROR_CODES.USERNAME_ALREADY_EXISTS]: 'Username already exists',
  [API_ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many requests',
  [API_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [API_ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [API_ERROR_CODES.DATABASE_ERROR]: 'Database error',
  [API_ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [API_ERROR_CODES.UNKNOWN_ERROR]: 'Unknown error',
  [API_ERROR_CODES.UNEXPECTED_ERROR]: 'An unexpected error occurred',

  // Validation Error Messages
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_USERNAME: 'Username must contain only letters, numbers, underscores and hyphens',
  INVALID_PASSWORD:
    'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  USERNAME_LENGTH: `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`,
  PASSWORD_LENGTH: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`,
  EMAIL_LENGTH: `Email must be between ${MIN_EMAIL_LENGTH} and ${MAX_EMAIL_LENGTH} characters`,
  NAME_LENGTH: `Name must not exceed ${MAX_NAME_LENGTH} characters`,
  INVALID_NAME: 'Name can only contain letters, spaces, hyphens and apostrophes',
  INVALID_PAGE: 'Page must be a positive integer',
  INVALID_LIMIT: `Limit must be a positive integer between 1 and ${MAX_PAGE_SIZE}`,
  INVALID_ROLE: 'Invalid role',
  TEAM_NAME_LENGTH: `Team name must be between ${MIN_TEAM_NAME_LENGTH} and ${MAX_TEAM_NAME_LENGTH} characters`,
  TEAM_TAG_LENGTH: `Team tag must be between ${MIN_TEAM_TAG_LENGTH} and ${MAX_TEAM_TAG_LENGTH} characters`,
  TEAM_TAG_FORMAT: 'Team tag can only contain uppercase letters and numbers',
  TEAM_DESCRIPTION_LENGTH: `Description must not exceed ${MAX_TEAM_DESCRIPTION_LENGTH} characters`,
};
