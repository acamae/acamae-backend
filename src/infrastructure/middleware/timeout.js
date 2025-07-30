import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

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
          HTTP_STATUS.REQUEST_TIMEOUT,
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
