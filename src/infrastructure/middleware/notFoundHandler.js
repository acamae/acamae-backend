import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Middleware to handle 404 errors
 * @param {import('express').Request} _req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const notFoundHandler = (_req, _res, next) => {
  next(
    createError('Resource not found', API_ERROR_CODES.RESOURCE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  );
};
