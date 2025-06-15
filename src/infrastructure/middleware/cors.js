import cors from 'cors';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';
import { config } from '../config/environment.js';

/**
 * CORS options
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.allowedOrigins;
    const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

    if (isAllowedOrigin) {
      callback(null, true);
    } else {
      callback(
        createError('Not allowed by CORS', API_ERROR_CODES.CORS_ERROR, HTTP_STATUS.FORBIDDEN)
      );
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * CORS middleware
 * @param {import('express').Application} app - Express application
 */
export const applyCors = (app) => {
  app.use(cors(corsOptions));
};

/**
 * CORS preflight middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const corsPreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(HTTP_STATUS.NO_CONTENT).end();
  } else {
    next();
  }
};

/**
 * CORS error handler
 * @param {Error} error - Error object
 * @param {import('express').Request} _req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const corsErrorHandler = (error, _req, res, next) => {
  if (error.code === API_ERROR_CODES.CORS_ERROR) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: HTTP_STATUS.FORBIDDEN,
      },
    });
  } else {
    next(error);
  }
};
