import { API_ERROR_CODES, ERROR_MESSAGES } from '../constants/apiCodes.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * @typedef {Object} ErrorOptions
 * @property {string} [message] - Error message
 * @property {string} [code] - API error code
 * @property {number} [status] - HTTP status code
 * @property {Object} [details] - Additional error details
 */

/**
 * Create an error object with API error code
 * @param {string|ErrorOptions} messageOrOptions - Error message or options object
 * @param {string} [code] - API error code
 * @param {number} [status] - HTTP status code
 * @returns {Error} Error object
 */
export const createError = (
  messageOrOptions,
  code = API_ERROR_CODES.INTERNAL_SERVER_ERROR,
  status = HTTP_STATUS.INTERNAL_SERVER_ERROR
) => {
  // Handle object-based error creation
  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    const { message, code: errorCode, status: errorStatus, details } = messageOrOptions;
    const error = new Error(
      message || ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[API_ERROR_CODES.UNEXPECTED_ERROR]
    );
    error.code = errorCode || API_ERROR_CODES.INTERNAL_SERVER_ERROR;
    error.status = errorStatus || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (details) error.details = details;
    return error;
  }

  // Handle parameter-based error creation
  const error = new Error(
    messageOrOptions || ERROR_MESSAGES[code] || ERROR_MESSAGES[API_ERROR_CODES.UNEXPECTED_ERROR]
  );
  error.code = code;
  error.status = status;
  return error;
};

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @returns {Object} Error response
 */
export const handleError = (error) => {
  const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = error.code || API_ERROR_CODES.INTERNAL_SERVER_ERROR;
  const message =
    error.message || ERROR_MESSAGES[code] || ERROR_MESSAGES[API_ERROR_CODES.UNEXPECTED_ERROR];

  return {
    status,
    code,
    message,
    ...(error.details && { details: error.details }),
  };
};

/**
 * Handle validation errors
 * @param {Array<Object>} errors - Validation errors
 * @returns {Object} Error response
 */
export const handleValidationError = (errors) => {
  const status = HTTP_STATUS.BAD_REQUEST;
  const code = API_ERROR_CODES.VALIDATION_ERROR;
  const message = ERROR_MESSAGES[code];

  return {
    status,
    code,
    message,
    details: errors,
  };
};

/**
 * Handle not found errors
 * @returns {Object} Error response
 */
export const handleNotFoundError = () => {
  const status = HTTP_STATUS.NOT_FOUND;
  const code = API_ERROR_CODES.NOT_FOUND;
  const message = ERROR_MESSAGES[code];

  return {
    status,
    code,
    message,
  };
};

/**
 * Handle unauthorized errors
 * @returns {Object} Error response
 */
export const handleUnauthorizedError = () => {
  const status = HTTP_STATUS.UNAUTHORIZED;
  const code = API_ERROR_CODES.UNAUTHORIZED;
  const message = ERROR_MESSAGES[code];

  return {
    status,
    code,
    message,
  };
};

/**
 * Handle forbidden errors
 * @returns {Object} Error response
 */
export const handleForbiddenError = () => {
  const status = HTTP_STATUS.FORBIDDEN;
  const code = API_ERROR_CODES.FORBIDDEN;
  const message = ERROR_MESSAGES[code];

  return {
    status,
    code,
    message,
  };
};

/**
 * Handle conflict errors
 * @returns {Object} Error response
 */
export const handleConflictError = () => {
  const status = HTTP_STATUS.CONFLICT;
  const code = API_ERROR_CODES.CONFLICT;
  const message = ERROR_MESSAGES[code];

  return {
    status,
    code,
    message,
  };
};
