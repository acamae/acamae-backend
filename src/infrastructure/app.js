import express from 'express';

import { config } from './config/environment.js';
import {
  applyCompression,
  applySecurityMiddleware,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  responseHelpersMiddleware,
} from './middleware/index.js';
import { errorLogger, requestLogger } from './middleware/logging.js';
import router from './routes/index.js';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// 1. RequestId middleware - MUST be first for tracking
app.use(requestIdMiddleware);

// 2. Response helpers - Add apiSuccess/apiError to all responses
app.use(responseHelpersMiddleware);

// 3. Security (helmet, cors, rate-limits, xss, etc.)
applySecurityMiddleware(app);

// 4. Compression
applyCompression(app);

// 5. Request logging (Winston) - After requestId is available
if (config.env !== 'test') {
  app.use(requestLogger);
}

// 6. Apply routes
app.use(router);

// 7. Error logging - Before error handlers
if (config.env !== 'test') {
  app.use(errorLogger);
}

// 8. 404 handler - Must be before error handler
app.use(notFoundHandler);

// 9. Global error handler - MUST be last
app.use(errorHandler);

export default app;
