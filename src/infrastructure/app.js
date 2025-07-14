import express from 'express';

import { API_ROUTES } from '../shared/constants/apiRoutes.js';

import { config } from './config/environment.js';
import { applyCompression } from './middleware/compression.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { applyLoggingMiddleware } from './middleware/logging.js';
import { responseHelpersMiddleware } from './middleware/responseHelpers.js';
import { applySecurityMiddleware } from './middleware/security.js';
import router from './routes/index.js';

const app = express();

// Apply response helpers middleware first (needed by other middlewares)
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

// Health check route
app.get(API_ROUTES.HEALTH, (req, res) => {
  res.json({
    status: 'SUCCESS',
    message: 'Servidor funcionando correctamente',
    data: {
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
