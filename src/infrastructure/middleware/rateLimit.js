import rateLimiter from 'express-rate-limit';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { API_ROUTES } from '../../shared/constants/apiRoutes.js';

/**
 * Create rate limiter
 * @param {Object} options - Rate limiter options
 * @returns {import('express-rate-limit').RateLimit} Rate limiter
 */
const createRateLimiter = (options) => {
  return rateLimiter({
    windowMs: options.windowMs || 60 * 1000, // 1 minute
    max: options.max || 100, // Limit each IP to 100 requests per windowMs
    message: {
      status: 'error',
      code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again in 1 minute',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: options.skipSuccessfulRequests || false, // Don't count successful requests
    skipFailedRequests: options.skipFailedRequests || false, // Don't count failed requests
    keyGenerator: (req) => {
      // Use IP + User Agent as key for better accuracy
      return `${req.ip}-${req.headers['user-agent']}`;
    },
  });
};

/**
 * Rate limiters for different routes
 */
export const rateLimiters = {
  // Auth routes rate limiter (covers all auth routes)
  auth: createRateLimiter({
    max: 10, // Limit each IP to 10 requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false, // Count failed attempts
  }),

  // API routes rate limiter (excluding auth routes)
  api: createRateLimiter({
    max: 60, // Limit each IP to 60 requests per minute
    skipSuccessfulRequests: false, // Count all requests
    skipFailedRequests: false, // Count all requests
  }),

  // Public routes rate limiter (health check, etc.)
  public: createRateLimiter({
    max: 30, // Limit each IP to 30 requests per minute
    skipSuccessfulRequests: false, // Count all requests
    skipFailedRequests: false, // Count all requests
  }),

  // Admin routes rate limiter
  admin: createRateLimiter({
    max: 30, // Limit each IP to 30 requests per minute
    skipSuccessfulRequests: false, // Count all requests
    skipFailedRequests: false, // Count all requests
  }),

  // Development routes rate limiter
  dev: createRateLimiter({
    max: 100, // Limit each IP to 100 requests per minute
    skipSuccessfulRequests: false, // Count all requests
    skipFailedRequests: false, // Count all requests
  }),
};

/**
 * Apply rate limiters to routes
 * @param {import('express').Application} app - Express application
 */
export const applyRateLimiters = (app) => {
  try {
    // Apply auth rate limiter to all auth routes
    app.use(API_ROUTES.AUTH.BASE, rateLimiters.auth);

    // Apply public rate limiter to health check
    app.use(API_ROUTES.HEALTH, rateLimiters.public);

    // Apply admin rate limiter to admin routes
    app.use(API_ROUTES.ADMIN.BASE, rateLimiters.admin);

    // Apply dev rate limiter to dev routes
    app.use(API_ROUTES.DEV, rateLimiters.dev);

    // Apply API rate limiter to all API routes except auth, health, admin, and dev
    app.use(API_ROUTES.BASE, (req, res, next) => {
      // Skip rate limiting for specific routes
      if (
        req.path.startsWith(API_ROUTES.AUTH.BASE) ||
        req.path === API_ROUTES.HEALTH ||
        req.path.startsWith(API_ROUTES.ADMIN.BASE) ||
        req.path.startsWith(API_ROUTES.DEV)
      ) {
        return next();
      }
      rateLimiters.api(req, res, next);
    });
  } catch (error) {
    console.error('Error applying rate limiters:', error);
    throw error;
  }
};
