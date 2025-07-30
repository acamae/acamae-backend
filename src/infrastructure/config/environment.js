import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Load environment files in order of priority:
 * 1. Base .env file
 * 2. Environment-specific file (.env.development or .env.production)
 * 3. Local .env file (not in git)
 */
function loadEnvFiles() {
  // Preserve the original NODE_ENV before loading files
  const originalNodeEnv = process.env.NODE_ENV;

  // Load base .env file
  dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
  });

  // Load environment-specific file based on original NODE_ENV
  const nodeEnv = originalNodeEnv || process.env.NODE_ENV || 'development';
  dotenv.config({
    path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
    override: true,
  });

  // Load .env.local file if it exists
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: true,
  });

  // Restore the original NODE_ENV if it was set
  if (originalNodeEnv) {
    process.env.NODE_ENV = originalNodeEnv;
  }
}

// Load environment files
loadEnvFiles();

// Detect if running inside Docker
const isDockerEnvironment = () => {
  // Check multiple indicators of Docker environment
  return (
    process.env.DOCKER_ENV === 'true' || // Explicit flag
    process.env.HOSTNAME?.startsWith('acamae-') || // Docker container hostname pattern
    fs.existsSync('/.dockerenv') || // Docker container indicator file
    process.env.NODE_ENV === 'production' // Assume production runs in Docker
  );
};

// Auto-adjust DATABASE_URL based on environment
const adjustDatabaseUrl = (originalUrl) => {
  if (!originalUrl) return originalUrl;

  const isDocker = isDockerEnvironment();

  if (isDocker && originalUrl.includes('@localhost:')) {
    // Running in Docker but URL points to localhost -> change to db
    return originalUrl.replace('@localhost:', '@db:');
  } else if (!isDocker && originalUrl.includes('@db:')) {
    // Running locally but URL points to db -> change to localhost
    return originalUrl.replace('@db:', '@localhost:');
  }

  return originalUrl;
};

// Default values according to the environment
const defaultValues = {
  development: {
    port: '4000',
    corsOrigin: 'https://localhost',
    frontendUrl: 'https://localhost',
    rateLimitWindowMs: '900000', // 15 minutes
    rateLimitMax: '500', // 500 requests per 15 minutes
    rateLimitAuthWindowMs: '900000', // 15 minutes
    rateLimitAuthMax: '10', // 10 attempts per 15 minutes
  },
  production: {
    port: '4000',
    corsOrigin: process.env.FRONTEND_URL || 'https://tu-dominio.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://tu-dominio.com',
    rateLimitWindowMs: '900000', // 15 minutes
    rateLimitMax: '500', // 500 requests per 15 minutes
    rateLimitAuthWindowMs: '900000', // 15 minutes
    rateLimitAuthMax: '10', // 10 attempts per 15 minutes
  },
  test: {
    port: '4001',
    corsOrigin: 'https://localhost',
    frontendUrl: 'https://localhost',
    rateLimitWindowMs: '1000',
    rateLimitMax: '1000',
    rateLimitAuthWindowMs: '1000',
    rateLimitAuthMax: '1000',
  },
};

const nodeEnv = process.env.NODE_ENV || 'development';
const defaults = defaultValues[nodeEnv] || defaultValues.development;

/**
 * Environment configuration schema
 * @typedef {Object} Environment
 * @property {string} NODE_ENV - Execution environment ('development' | 'test' | 'production')
 * @property {number} PORT - Server port
 * @property {string} CORS_ORIGIN - Allowed CORS origin
 * @property {string} FRONTEND_URL - Frontend application URL
 * @property {string} JWT_SECRET - JWT secret key
 * @property {string} JWT_REFRESH_SECRET - JWT refresh secret key
 * @property {string} JWT_EXPIRES_IN - JWT token expiration time
 * @property {string} JWT_REFRESH_EXPIRES_IN - JWT refresh token expiration time
 * @property {string} DATABASE_URL - Database connection URL
 * @property {string} COOKIE_SECRET - Cookie encryption secret
 * @property {string} COOKIE_MAX_AGE - Cookie max age in milliseconds
 * @property {string} SESSION_SECRET - Session encryption secret
 * @property {string} [MAIL_HOST] - SMTP host for email
 * @property {string} [MAIL_PORT] - SMTP port for email
 * @property {string} [MAIL_USER] - SMTP username
 * @property {string} [MAIL_PASSWORD] - SMTP password
 * @property {string} [MAIL_FROM] - Default sender email
 * @property {string} [MAIL_API_KEY] - MailerSend API key
 * @property {string} RATE_LIMIT_WINDOW_MS - Rate limit window in milliseconds
 * @property {string} RATE_LIMIT_MAX - Rate limit max requests
 * @property {string} RATE_LIMIT_AUTH_WINDOW_MS - Rate limit auth window in milliseconds
 * @property {string} RATE_LIMIT_AUTH_MAX - Rate limit auth max requests
 */

// Validation schema for environment variables
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default(defaults.port),

  // Security
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(32).optional(),
  COOKIE_MAX_AGE: z.string().default('86400000'),
  SESSION_SECRET: z.string().min(32).optional(),

  // CORS
  CORS_ORIGIN: z.string().default(defaults.corsOrigin),
  FRONTEND_URL: z.string().default(defaults.frontendUrl),

  // Database
  DATABASE_URL: z.string(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default(defaults.rateLimitWindowMs),
  RATE_LIMIT_MAX: z.string().default(defaults.rateLimitMax),
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().default(defaults.rateLimitAuthWindowMs),
  RATE_LIMIT_AUTH_MAX: z.string().default(defaults.rateLimitAuthMax),

  // Email (optional)
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.string().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_API_KEY: z.string().optional(),

  // Token expiration times
  VERIFICATION_EXPIRATION: z.string().default('10m'),
  PASSWORD_RESET_EXPIRATION: z.string().default('10m'),

  // Perspective API (optional)
  PERSPECTIVE_API_KEY: z.string().optional(),
  PERSPECTIVE_THRESHOLD: z.string().default('0.7'),
});

// Parse and validate environment variables
const env = envSchema.safeParse(process.env);

// Handle validation errors
if (!env.success) {
  console.error('Environment Variables Error:');
  console.error(env.error.format());
  throw new Error('Invalid environment variables');
}

/**
 * Convert duration string to milliseconds
 * @param {string} duration - Duration string like '10m', '1h', '30s'
 * @returns {number} Duration in milliseconds
 */
function durationToMs(duration) {
  const regex = /^(\d+)([smhd])$/;
  const match = regex.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

// Export validated configuration
export const config = {
  // Server
  env: env.data.NODE_ENV,
  port: parseInt(env.data.PORT, 10),

  // Logging
  logs: {
    format: env.data.NODE_ENV === 'production' ? 'combined' : 'dev',
  },

  // Security
  jwt: {
    secret: env.data.JWT_SECRET,
    refreshSecret: env.data.JWT_REFRESH_SECRET,
    expiresIn: durationToMs(env.data.JWT_EXPIRES_IN),
    refreshExpiresIn: durationToMs(env.data.JWT_REFRESH_EXPIRES_IN),
  },
  cookie: {
    secret: env.data.COOKIE_SECRET,
    maxAge: parseInt(env.data.COOKIE_MAX_AGE, 10),
  },
  session: {
    secret: env.data.SESSION_SECRET,
  },

  // CORS
  cors: {
    origin: env.data.CORS_ORIGIN,
    frontendUrl: env.data.FRONTEND_URL,
  },

  // Database
  database: {
    url: adjustDatabaseUrl(env.data.DATABASE_URL),
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(env.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(env.data.RATE_LIMIT_MAX, 10),
    auth: {
      windowMs: parseInt(env.data.RATE_LIMIT_AUTH_WINDOW_MS, 10),
      max: parseInt(env.data.RATE_LIMIT_AUTH_MAX, 10),
    },
  },

  // Token expiration
  tokens: {
    verificationExpiration: durationToMs(env.data.VERIFICATION_EXPIRATION),
    passwordResetExpiration: durationToMs(env.data.PASSWORD_RESET_EXPIRATION),
  },

  // Email
  mail:
    env.data.MAIL_API_KEY || env.data.MAIL_HOST
      ? {
          host: env.data.MAIL_HOST,
          port: parseInt(env.data.MAIL_PORT, 10),
          user: env.data.MAIL_USER,
          password: env.data.MAIL_PASSWORD,
          from: env.data.MAIL_FROM,
          apiKey: env.data.MAIL_API_KEY,
        }
      : null,

  // Perspective API
  perspective: env.data.PERSPECTIVE_API_KEY
    ? {
        apiKey: env.data.PERSPECTIVE_API_KEY,
        threshold: parseFloat(env.data.PERSPECTIVE_THRESHOLD),
      }
    : null,
};
