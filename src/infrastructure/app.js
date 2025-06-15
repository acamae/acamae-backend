import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/environment.js';
import { apiResponseHandler } from './middleware/apiResponse.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { applyRateLimiters } from './middleware/rateLimit.js';
import router from './routes/index.js';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Apply security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Apply compression
app.use(compression());

// Apply logging
if (config.env !== 'test') {
  app.use(morgan(config.logs?.format || 'dev'));
}

// Parse JSON bodies
app.use(express.json());

// Apply API response middleware
app.use(apiResponseHandler);

// Apply rate limiters
applyRateLimiters(app);

// Apply routes
app.use(router);

// Apply error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
