import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom token for requestId
 */
morgan.token('requestId', (req) => req.requestId || uuidv4());

/**
 * Custom token for error details
 */
morgan.token('errorDetails', (req) => {
  if (req.log && req.log.error) {
    return JSON.stringify({
      error: req.log.error,
      stack: req.log.stack,
      requestId: req.requestId,
    });
  }
  return '';
});

/**
 * Custom token for response time with timeout detection
 */
morgan.token('responseTimeWithTimeout', (req, res) => {
  const responseTime = morgan['response-time'](req, res);
  const timeout = req.timeout || 30000; // Default 30s timeout

  if (responseTime && parseInt(responseTime) > timeout) {
    return `${responseTime}ms (TIMEOUT WARNING)`;
  }
  return responseTime;
});

/**
 * Custom log format for development
 */
const devFormat =
  ':method :url :status :responseTimeWithTimeout ms - :res[content-length] :requestId :errorDetails';

/**
 * Custom log format for production
 */
const prodFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :requestId :errorDetails';

/**
 * Apply logging middleware
 * @param {import('express').Application} app - Express application
 */
export const applyLoggingMiddleware = (app) => {
  // Set log format based on environment
  const logFormat = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

  // Apply Morgan logging
  app.use(morgan(logFormat));

  // Add request timing middleware
  app.use((req, res, next) => {
    const startTime = Date.now();

    // Add timing to response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const timeout = req.timeout || 30000;

      // Log slow requests
      if (duration > timeout * 0.8) {
        // 80% of timeout
        console.warn(
          `⚠️  Slow request detected: ${req.method} ${req.url} took ${duration}ms (timeout: ${timeout}ms)`
        );
      }

      // Log timeout requests
      if (duration > timeout) {
        console.error(
          `🚨 Timeout request: ${req.method} ${req.url} took ${duration}ms (exceeded ${timeout}ms timeout)`
        );
      }
    });

    next();
  });

  // Add error logging middleware
  app.use((error, req, res, next) => {
    // Log error details
    console.error('🚨 Error occurred:', {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId,
      url: req.url,
      method: req.method,
      body: req.body,
      headers: req.headers,
    });

    // Add error to request for Morgan
    req.log = {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId,
    };

    next(error);
  });
};
