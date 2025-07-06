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
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Load base .env file
  dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
  });

  // Load environment-specific file
  dotenv.config({
    path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
    override: true,
  });

  // Load .env.local file if it exists
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: true,
  });
}

// Load environment files
loadEnvFiles();

// Default values according to the environment
const defaultValues = {
  development: {
    port: '4000',
    corsOrigin: 'https://localhost',
    frontendUrl: 'https://localhost',
    rateLimitWindowMs: '900000', // 15 minutos
    rateLimitMax: '100',
    rateLimitAuthWindowMs: '3600000', // 1 hora
    rateLimitAuthMax: '5',
  },
  production: {
    port: '4000',
    corsOrigin: process.env.FRONTEND_URL || 'https://tu-dominio.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://tu-dominio.com',
    rateLimitWindowMs: '900000', // 15 minutos
    rateLimitMax: '50', // Más restrictivo en producción
    rateLimitAuthWindowMs: '3600000', // 1 hora
    rateLimitAuthMax: '3', // Más restrictivo en producción
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
  REFRESH_EXPIRATION: z.string().default('7d'),
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
  const match = duration.match(/^(\d+)([smhd])$/);
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
    expiresIn: env.data.JWT_EXPIRES_IN,
    refreshExpiresIn: env.data.JWT_REFRESH_EXPIRES_IN,
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
    url: env.data.DATABASE_URL,
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
    refreshExpiration: durationToMs(env.data.REFRESH_EXPIRATION),
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
};
