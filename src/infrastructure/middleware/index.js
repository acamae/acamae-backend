import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';

// Infrastructure Middleware Exports
export { requestIdMiddleware } from './requestId.js';
export { responseHelpersMiddleware, apiSuccess, apiError } from './responseHelpers.js';
export { errorHandler, notFoundHandler, asyncHandler } from './errorHandler.js';

// Other existing middleware
export { applySecurityMiddleware } from './security.js';
export { applyAllSecurityMiddleware } from './security.js';
export { validateRequest } from './validation.js';
export { validateParams } from './validation.js';
export { sanitizeQueryParams } from './validation.js';
export { sanitizeInput } from './validation.js';

/**
 * Timeout middleware to prevent hanging requests
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns {import('express').RequestHandler}
 */
export const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        return res.apiError(
          408,
          API_ERROR_CODES.ETIMEDOUT,
          'Request timeout - the operation took too long to complete',
          {
            type: 'server',
            details: [
              {
                field: 'timeout',
                code: 'REQUEST_TIMEOUT',
                message: `Request exceeded timeout of ${timeoutMs}ms`,
              },
            ],
          }
        );
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

export { authenticate, authorize, isAdmin, isManagerOrAdmin } from './auth.js';
export { applyCompression } from './compression.js';
export { applyLoggingMiddleware } from './logging.js';
