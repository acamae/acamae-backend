import express from 'express';

import { config } from './config/environment.js';
import { applyCompression } from './middleware/compression.js';
import { errorHandler } from './middleware/errorHandler.js';
import { errorLogger, requestLogger } from './middleware/logging.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { applySecurityMiddleware } from './middleware/security.js';
import router from './routes/index.js';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security (helmet, cors, rate-limits, xss, etc.)
applySecurityMiddleware(app);

// Compression
applyCompression(app);

// Request logging (Winston)
if (config.env !== 'test') {
  app.use(requestLogger);
}

// Apply routes
app.use(router);

// Error logging
if (config.env !== 'test') {
  app.use(errorLogger);
}

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
