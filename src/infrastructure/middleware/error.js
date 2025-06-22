import { Prisma } from '@prisma/client';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { handleError } from '../../shared/utils/error.js';

/**
 * Error handling middleware
 * @param {Error} error - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next function
 */
export const errorHandler = (error, req, res, _next) => {
  // Log error
  console.error('Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: API_ERROR_CODES.DUPLICATE_ENTRY,
            message: ERROR_MESSAGES[API_ERROR_CODES.DUPLICATE_ENTRY],
            status: HTTP_STATUS.CONFLICT,
            field: error.meta?.target?.[0],
          },
        });
      case 'P2025':
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
            message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
            status: HTTP_STATUS.NOT_FOUND,
          },
        });
      default:
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            code: API_ERROR_CODES.DATABASE_ERROR,
            message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          },
        });
    }
  }

  // Handle validation errors
  if (error.code === API_ERROR_CODES.VALIDATION_ERROR) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: HTTP_STATUS.BAD_REQUEST,
      },
    });
  }

  // Handle authentication errors
  if (error.code === API_ERROR_CODES.UNAUTHORIZED) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: HTTP_STATUS.UNAUTHORIZED,
      },
    });
  }

  // Handle authorization errors
  if (error.code === API_ERROR_CODES.FORBIDDEN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: HTTP_STATUS.FORBIDDEN,
      },
    });
  }

  // Handle not found errors
  if (error.code === API_ERROR_CODES.NOT_FOUND) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: HTTP_STATUS.NOT_FOUND,
      },
    });
  }

  // Handle conflict errors
  if (error.code === API_ERROR_CODES.CONFLICT) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: HTTP_STATUS.CONFLICT,
      },
    });
  }

  // Handle all other errors
  const errorResponse = handleError(error);
  res.status(errorResponse.error.status).json(errorResponse);
};

/**
 * Not found middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.code = API_ERROR_CODES.NOT_FOUND;
  error.status = HTTP_STATUS.NOT_FOUND;
  next(error);
};
