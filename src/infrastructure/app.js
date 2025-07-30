import express from 'express';

import { applyCompression } from './middleware/compression.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { applyLoggingMiddleware } from './middleware/logging.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { responseHelpersMiddleware } from './middleware/responseHelpers.js';
import { applySecurityMiddleware } from './middleware/security.js';
import router from './routes/index.js';

const app = express();

// Apply request ID middleware first (needed by other middlewares)
app.use(requestIdMiddleware);

// Apply response helpers middleware (needed by other middlewares)
app.use(responseHelpersMiddleware);

// Apply security middleware
applySecurityMiddleware(app);

// Apply logging middleware
applyLoggingMiddleware(app);

// Apply compression middleware
applyCompression(app);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use(router);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
