import { API_SUCCESS_CODES } from '../../shared/constants/apiCodes.js';

/**
 * Response helpers for consistent API responses
 * Implements the exact structure required by the frontend
 */

/**
 * Helper for successful responses
 * @param {import('express').Response} res - Express response object
 * @param {any} data - Data to return (or null)
 * @param {string} message - Descriptive message in English
 * @param {object} meta - Optional metadata (pagination, etc.)
 * @returns {import('express').Response} Response object
 */
export const apiSuccess = (res, data = null, message = 'Operation successful', meta = null) => {
  const response = {
    success: true,
    data,
    status: res.statusCode,
    code: API_SUCCESS_CODES.SUCCESS,
    message,
    timestamp: new Date().toISOString(),
    requestId: res.req?.requestId || 'unknown',
  };

  if (meta) {
    response.meta = meta;
  }

  return res.json(response);
};

/**
 * @typedef {Object} ErrorDetails
 * @property {string} type - Error type
 * @property {Array<Object>} details - Additional error details
 */

/**
 * Helper for error responses
 * @param {import('express').Response} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} code - Semantic error code
 * @param {string} message - Error message in English
 * @param {ErrorDetails} errorDetails - Additional error details
 * @param {object} meta - Optional metadata
 * @returns {import('express').Response} Response object
 */
export const apiError = (res, status, code, message, errorDetails = null, meta = null) => {
  const response = {
    success: false,
    data: null,
    status,
    code,
    message,
    timestamp: new Date().toISOString(),
    requestId: res.req?.requestId || 'unknown',
  };

  if (errorDetails) {
    response.error = errorDetails;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(status).json(response);
};

/**
 * Middleware to add helpers to all responses
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const responseHelpersMiddleware = (req, res, next) => {
  // Add helpers to response
  res.apiSuccess = (data, message, meta) => apiSuccess(res, data, message, meta);
  res.apiError = (statusCode, code, message, errorDetails, meta) =>
    apiError(res, statusCode, code, message, errorDetails, meta);

  next();
};
