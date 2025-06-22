import helmet from 'helmet';

import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { config } from '../config/environment.js';

/**
 * Helmet middleware
 * @param {import('express').Application} app - Express application
 */
export const applyHelmet = (app) => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...config.cors.allowedOrigins],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    })
  );
};

/**
 * Helmet error handler
 * @param {Error} error - Error object
 * @param {import('express').Request} _req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const helmetErrorHandler = (error, _req, res, next) => {
  if (error instanceof helmet.HelmetError) {
    res.status(400).json({
      success: false,
      error: {
        code: API_ERROR_CODES.SECURITY_POLICY_VIOLATION,
        message: ERROR_MESSAGES[API_ERROR_CODES.SECURITY_POLICY_VIOLATION],
        status: 400,
      },
    });
  } else {
    next(error);
  }
};
