import crypto from 'crypto';

import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add a unique requestId to each request
 * Generates a UUID v4 or uses the X-Request-ID header if present
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const requestIdMiddleware = (req, res, next) => {
  try {
    // Use the X-Request-ID header if present, or generate a new one
    req.requestId = req.headers['x-request-id'] || uuidv4();

    // Add the requestId to the response header for traceability
    res.setHeader('X-Request-ID', req.requestId);

    next();
  } catch (error) {
    console.error('Error generating requestId:', error);
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  }
};
