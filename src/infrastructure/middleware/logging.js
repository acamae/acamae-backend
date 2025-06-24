import { v4 as uuidv4 } from 'uuid';
import { format, winston } from 'winston';

import { config } from '../config/environment.js';

/**
 * Create a logger instance
 * @returns {winston.Logger} Logger instance
 */
const createLogger = () => {
  const logger = winston.createLogger({
    level: config.log.level,
    format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
    defaultMeta: { service: 'api' },
    transports: [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });

  if (config.env !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      })
    );
  }

  return logger;
};

const logger = createLogger();

/**
 * Request logging middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

/**
 * Error logging middleware
 * @param {Error} error - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorLogger = (error, req, res, next) => {
  logger.error('Error occurred', {
    requestId: req.requestId,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    },
  });

  next(error);
};

/**
 * Log a message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
export const log = (level, message, meta = {}) => {
  logger.log(level, message, meta);
};

/**
 * Log an error
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} meta - Additional metadata
 */
export const logError = (message, error, meta = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    ...meta,
  });
};

/**
 * Log a warning
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
export const logWarning = (message, meta = {}) => {
  logger.warn(message, meta);
};

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};
