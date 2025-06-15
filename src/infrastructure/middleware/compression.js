import compression from 'compression';

import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Compression middleware
 * @param {import('express').Application} app - Express application
 */
export const applyCompression = (app) => {
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Use compression by default
        return compression.filter(req, res);
      },
      level: 6, // Compression level (0-9)
      threshold: 1024, // Only compress responses larger than 1KB
    })
  );
};

/**
 * Compression error handler
 * @param {Error} error - Error object
 * @param {import('express').Request} _req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const compressionErrorHandler = (error, _req, _res, next) => {
  if (error.type === 'entity.too.large') {
    next(
      createError(
        ERROR_MESSAGES[API_ERROR_CODES.REQUEST_TOO_LARGE],
        API_ERROR_CODES.REQUEST_TOO_LARGE,
        HTTP_STATUS.PAYLOAD_TOO_LARGE
      )
    );
  } else {
    next(error);
  }
};
