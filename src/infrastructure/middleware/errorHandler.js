import { Prisma } from '@prisma/client';

import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';
import { sanitizeResponse } from '../../shared/utils/sanitize.js';

/**
 * Centralized error handling middleware
 * This middleware handles all errors in a consistent way across the application
 * It provides clear error messages and proper HTTP status codes
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next function
 */
export const errorHandler = (err, req, res, _next) => {
  // Enhanced error logging
  const errorDetails = {
    message: err.message,
    code: err.code,
    status: err.status,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
  };

  // Log error details
  console.error('Error Details:', errorDetails);

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          code: API_ERROR_CODES.DUPLICATE_ENTRY,
          message: sanitizeResponse(ERROR_MESSAGES[API_ERROR_CODES.DUPLICATE_ENTRY]),
          details: err.meta?.target?.[0],
        });
      case 'P2025':
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
          message: sanitizeResponse(ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND]),
        });
      default:
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: sanitizeResponse(ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR]),
        });
    }
  }

  // Handle different types of errors
  if (err instanceof Error) {
    // Standard Error object
    const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const code = err.code || API_ERROR_CODES.INTERNAL_SERVER_ERROR;
    const message =
      err.message || ERROR_MESSAGES[code] || ERROR_MESSAGES[API_ERROR_CODES.UNEXPECTED_ERROR];

    // Sanitize error message and details to prevent XSS
    const sanitizedMessage = sanitizeResponse(message);
    const sanitizedDetails = err.details ? sanitizeResponse(err.details) : undefined;

    return res.status(status).json({
      status: 'error',
      code,
      message: sanitizedMessage,
      ...(sanitizedDetails && { details: sanitizedDetails }),
    });
  }

  // Handle non-Error objects
  console.error('Non-Error object received:', err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: ERROR_MESSAGES[API_ERROR_CODES.UNEXPECTED_ERROR],
  });
};

/**
 * Helper function to create and throw known errors
 * This makes error creation consistent across the application
 * @param {string} message - The error message
 * @param {string} code - The error code
 * @param {number} status - The HTTP status code
 * @param {object} details - The error details
 */
export const throwError = (message, code, status, details = null) => {
  const error = createError({ message, code, status, details });
  throw error;
};

/**
 * Helper function to handle async errors
 * This prevents try-catch blocks in route handlers
 * @param {Function} fn - The function to handle
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Async Handler Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    next(error);
  });
};
