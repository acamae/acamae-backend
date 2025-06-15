import { API_ERROR_CODES, API_SUCCESS_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { sanitizeResponse } from '../../shared/utils/sanitize.js';

/**
 * Standard API response structure
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {T|null} data - Response data
 * @property {number} status - HTTP status code
 * @property {string} message - Response message
 * @property {string} code - Response code
 */

/**
 * Create a success response
 * @template T
 * @param {T} data - Response data
 * @param {string} [code=API_SUCCESS_CODES.SUCCESS] - Success code
 * @param {string} [message='Success'] - Success message
 * @param {number} [status=HTTP_STATUS.OK] - HTTP status code
 * @returns {ApiResponse<T>} Success response
 */
export const createSuccessResponse = (
  data,
  code = API_SUCCESS_CODES.SUCCESS,
  message = 'Success',
  status = HTTP_STATUS.OK
) => ({
  success: true,
  data,
  status,
  message,
  code,
});

/**
 * Create an error response
 * @template T
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {number} [status=HTTP_STATUS.BAD_REQUEST] - HTTP status code
 * @param {T|null} [data=null] - Error data
 * @returns {ApiResponse<T>} Error response
 */
export const createErrorResponse = (
  code,
  message,
  status = HTTP_STATUS.BAD_REQUEST,
  data = null
) => ({
  success: false,
  data,
  status,
  message,
  code,
});

/**
 * Middleware to standardize API responses
 * @param {import('express').Request} _req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const apiResponseHandler = (_req, res, next) => {
  // Extend response object with standardized methods
  res.success = (data, message = 'Operation successful') => {
    return res.json({
      status: 'success',
      message,
      data: sanitizeResponse(data),
    });
  };

  res.error = (
    message = 'Operation failed',
    code = API_ERROR_CODES.UNKNOWN_ERROR,
    status = HTTP_STATUS.BAD_REQUEST
  ) => {
    return res.status(status).json({
      status: 'error',
      code,
      message: sanitizeResponse(message),
    });
  };

  // Handle validation errors
  res.validationError = (errors) => {
    res.error(API_ERROR_CODES.VALIDATION_ERROR, 'Validation error', HTTP_STATUS.BAD_REQUEST, {
      errors: sanitizeResponse(errors),
    });
  };

  // Handle not found errors
  res.notFound = (message = 'Resource not found') => {
    res.error(API_ERROR_CODES.NOT_FOUND, message, HTTP_STATUS.NOT_FOUND);
  };

  // Handle unauthorized errors
  res.unauthorized = (message = 'Unauthorized') => {
    res.error(API_ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
  };

  // Handle forbidden errors
  res.forbidden = (message = 'Forbidden') => {
    res.error(API_ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
  };

  // Handle rate limit errors
  res.rateLimitExceeded = (message = 'Too many requests') => {
    res.error(API_ERROR_CODES.RATE_LIMIT_EXCEEDED, message, HTTP_STATUS.TOO_MANY_REQUESTS);
  };

  // Handle server errors
  res.serverError = (message = 'Internal server error') => {
    res.error(API_ERROR_CODES.INTERNAL_SERVER_ERROR, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  };

  next();
};
