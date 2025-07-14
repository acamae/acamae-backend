import { Prisma } from '@prisma/client';

import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { sanitizeResponse } from '../../shared/utils/sanitize.js';

import { apiError } from './responseHelpers.js';

/**
 * Centralized error handling middleware
 * Updated to use the new consistent API response structure
 * Handles all errors with the exact format expected by frontend
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log for Morgan
  req.log = {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
  };

  // Log error details
  console.error('Error Details:', {
    message: err.message,
    code: err.code,
    status: err.status,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return apiError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      API_ERROR_CODES.AUTH_TOKEN_INVALID,
      'Invalid access token'
    );
  }

  if (err.name === 'TokenExpiredError') {
    return apiError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      'Expired access token'
    );
  }

  // Handle validation errors
  if (err.type === 'validation') {
    return apiError(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      API_ERROR_CODES.VALIDATION_ERROR,
      'The submitted data is not valid',
      {
        type: 'validation',
        details: err.details,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      }
    );
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return apiError(
          res,
          HTTP_STATUS.CONFLICT,
          API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
          'Resource already exists',
          {
            type: 'database',
            details: [
              {
                field: err.meta?.target?.[0] || 'unknown',
                code: 'DUPLICATE_ENTRY',
                message: 'Duplicate value',
              },
            ],
          }
        );
      case 'P2025':
        return apiError(
          res,
          HTTP_STATUS.NOT_FOUND,
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          'Resource not found',
          {
            type: 'database',
            details: [
              {
                field: 'resource',
                code: 'NOT_FOUND',
                message: 'The requested resource does not exist',
              },
            ],
          }
        );
      default:
        return apiError(
          res,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          API_ERROR_CODES.UNKNOWN_ERROR,
          'Database error',
          {
            type: 'database',
            ...(process.env.NODE_ENV !== 'production' && {
              details: [{ field: 'database', code: 'DATABASE_ERROR', message: err.message }],
              stack: err.stack,
            }),
          }
        );
    }
  }

  // Handle standard Error objects
  if (err instanceof Error) {
    const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const code = err.code || API_ERROR_CODES.UNKNOWN_ERROR;
    const message = sanitizeResponse(
      err.message || ERROR_MESSAGES[code] || ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN_ERROR]
    );

    const errorResponse = {
      type: 'server',
      ...(process.env.NODE_ENV !== 'production' && {
        details: [{ field: 'server', code: 'INTERNAL_ERROR', message: err.message }],
        stack: err.stack,
      }),
    };

    if (err.details) {
      errorResponse.details = sanitizeResponse(err.details);
    }

    return apiError(res, status, code, message, errorResponse);
  }

  // Handle non-Error objects
  console.error('Non-Error object received:', err);
  return apiError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    API_ERROR_CODES.UNKNOWN_ERROR,
    'Internal server error',
    {
      type: 'server',
      ...(process.env.NODE_ENV !== 'production' && {
        details: [
          { field: 'server', code: 'UNEXPECTED_ERROR', message: 'Non-Error object received' },
        ],
      }),
    }
  );
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
      requestId: req.requestId,
    });
    next(error);
  });
};

/**
 * 404 handler middleware
 * Handles routes that don't exist with the new API structure
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export const notFoundHandler = (req, res) => {
  return apiError(
    res,
    HTTP_STATUS.NOT_FOUND,
    API_ERROR_CODES.RESOURCE_NOT_FOUND,
    'The requested endpoint does not exist',
    {
      type: 'routing',
      details: [
        {
          field: 'route',
          code: 'ROUTE_NOT_FOUND',
          message: `The endpoint ${req.method} ${req.originalUrl} is not available`,
        },
      ],
    }
  );
};
