import express from 'express';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Body parser middleware
 * @param {import('express').Application} app - Express application
 */
export const applyBodyParser = (app) => {
  // Parse JSON bodies
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (error) {
          throw createError('Invalid JSON', API_ERROR_CODES.INVALID_JSON, HTTP_STATUS.BAD_REQUEST);
        }
      },
    })
  );

  // Parse URL-encoded bodies
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    })
  );

  // Parse raw bodies
  app.use(
    express.raw({
      type: 'application/octet-stream',
      limit: '10mb',
    })
  );

  // Parse text bodies
  app.use(
    express.text({
      type: 'text/plain',
      limit: '10mb',
    })
  );
};

/**
 * Body parser error handler
 * @param {Error} error - Error object
 * @param {import('express').Request} _req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const bodyParserErrorHandler = (error, _req, _res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    next(createError('Invalid JSON', API_ERROR_CODES.INVALID_JSON, HTTP_STATUS.BAD_REQUEST));
  } else if (error.type === 'entity.too.large') {
    next(
      createError(
        'Request entity too large',
        API_ERROR_CODES.REQUEST_TOO_LARGE,
        HTTP_STATUS.PAYLOAD_TOO_LARGE
      )
    );
  } else {
    next(error);
  }
};
