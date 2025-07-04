import cors from 'cors';
import express from 'express';
import rateLimiter from 'express-rate-limit';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { API_ROUTES } from '../../shared/constants/apiRoutes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';
import { sanitizeRequest } from '../../shared/utils/sanitize.js';
import { config } from '../config/environment.js';

/**
 * Custom HPP (HTTP Parameter Pollution) protection middleware
 * Prevents parameter pollution by keeping only the last value of each parameter
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const hppProtection = () => {
  return (req, _res, next) => {
    try {
      // Handle query parameters
      if (req.query) {
        Object.keys(req.query).forEach((key) => {
          if (Array.isArray(req.query[key])) {
            req.query[key] = req.query[key][req.query[key].length - 1];
          }
        });
      }

      // Handle body parameters
      if (req.body) {
        Object.keys(req.body).forEach((key) => {
          if (Array.isArray(req.body[key])) {
            req.body[key] = req.body[key][req.body[key].length - 1];
          }
        });
      }

      next();
    } catch (error) {
      next(
        createError(
          'Error processing request parameters',
          API_ERROR_CODES.INVALID_REQUEST,
          HTTP_STATUS.BAD_REQUEST
        )
      );
    }
  };
};

/**
 * XSS protection middleware using sanitize-html
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const xssProtection = () => {
  return (req, _res, next) => {
    try {
      sanitizeRequest(req);
      next();
    } catch (error) {
      next(
        createError(
          'Error sanitizing request data',
          API_ERROR_CODES.INVALID_REQUEST,
          HTTP_STATUS.BAD_REQUEST
        )
      );
    }
  };
};

/**
 * Security middleware
 * @param {import('express').Application} app - Express application
 */
export const applySecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(
    cors({
      origin: config.cors.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Data sanitization against XSS
  app.use(xssProtection());

  // Prevent parameter pollution
  app.use(hppProtection());

  // Trust proxy
  app.set('trust proxy', 1);

  // Rate limiting configuration
  const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all routes
  app.use(limiter);

  // Límite de tasa para rutas de autenticación
  const authLimiter = rateLimiter({
    windowMs: config.RATE_LIMIT_AUTH_WINDOW_MS,
    max: config.RATE_LIMIT_AUTH_MAX,
    message: {
      status: 'error',
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many requests. Please try again later.',
    },
  });

  // Límite de tasa general
  const generalLimiter = rateLimiter({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    message: {
      status: 'error',
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many requests. Please try again later.',
    },
  });

  // Apply rate limiting to auth routes
  app.use(API_ROUTES.AUTH.BASE, authLimiter);

  // Apply rate limiting to general routes
  app.use(generalLimiter);

  // Correlation ID middleware
  app.use((req, res, next) => {
    // If the client sends a x-correlation-id, we use it; if not, we generate a new one
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    // Add the correlation ID to the request for internal use
    req.correlationId = correlationId;

    // Add the correlation ID to the response
    res.setHeader('x-correlation-id', correlationId);

    next();
  });

  // Additional security headers
  app.use((_req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Access control to resources
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Prevent XSS in old browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cache Control
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );

    // Remover headers sensibles
    res.removeHeader('X-Powered-By');

    next();
  });

  // Request size limiting
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Block suspicious requests
  app.use((req, res, next) => {
    // --- Cabeceras sospechosas ---
    // Las cabeceras X-Forwarded-* son legítimas detrás de proxies (Nginx, Cloudflare, etc.).
    // Sólo las bloquearemos cuando la app NO confíe en el proxy.
    const forwardedHeaders = [
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-forwarded-port',
    ];

    // Si trust proxy está deshabilitado, consideramos sospechoso que lleguen estas cabeceras.
    if (!req.app.get('trust proxy')) {
      for (const header of forwardedHeaders) {
        if (Object.prototype.hasOwnProperty.call(req.headers, header)) {
          return res
            .status(HTTP_STATUS.AUTH_FORBIDDEN)
            .json({ message: 'Suspicious request detected' });
        }
      }
    }

    // --- Agentes de usuario maliciosos ---
    const suspiciousUserAgents = ['sqlmap', 'nikto', 'nmap', 'metasploit', 'burp', 'zap'];
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    if (suspiciousUserAgents.some((agent) => userAgent.includes(agent))) {
      return res
        .status(HTTP_STATUS.AUTH_FORBIDDEN)
        .json({ message: 'Suspicious request detected' });
    }

    next();
  });
};

/**
 * Content Security Policy middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const cspMiddleware = (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );
  next();
};

/**
 * Prevent clickjacking middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const preventClickjacking = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

/**
 * Prevent MIME type sniffing middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const preventMimeSniffing = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

/**
 * Prevent XSS attacks middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const preventXSS = (req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

/**
 * Prevent IE from executing downloads in your site's context middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const preventIEOpen = (req, res, next) => {
  res.setHeader('X-Download-Options', 'noopen');
  next();
};

/**
 * Disable client-side caching middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const noCache = (req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

/**
 * Apply all security middleware
 * @param {import('express').Application} app - Express application
 */
export const applyAllSecurityMiddleware = (app) => {
  applySecurityMiddleware(app);
  app.use(cspMiddleware);
  app.use(preventClickjacking);
  app.use(preventMimeSniffing);
  app.use(preventXSS);
  app.use(preventIEOpen);
  app.use(noCache);
};
