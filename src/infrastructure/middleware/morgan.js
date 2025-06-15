import { createWriteStream } from 'fs';
import { join } from 'path';

import morgan from 'morgan';

import { config } from '../config/environment.js';

/**
 * Morgan token for request ID
 * @param {import('express').Request} req - Express request
 * @returns {string} Request ID
 */
morgan.token('request-id', (req) => req.requestId);

/**
 * Morgan token for response time in milliseconds
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {string} Response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  if (!res._header || !req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

/**
 * Morgan token for request body
 * @param {import('express').Request} req - Express request
 * @returns {string} Request body
 */
morgan.token('body', (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }
  return '';
});

/**
 * Morgan token for request query
 * @param {import('express').Request} req - Express request
 * @returns {string} Request query
 */
morgan.token('query', (req) => {
  if (req.query && Object.keys(req.query).length > 0) {
    return JSON.stringify(req.query);
  }
  return '';
});

/**
 * Morgan token for request params
 * @param {import('express').Request} req - Express request
 * @returns {string} Request params
 */
morgan.token('params', (req) => {
  if (req.params && Object.keys(req.params).length > 0) {
    return JSON.stringify(req.params);
  }
  return '';
});

/**
 * Morgan token for request headers
 * @param {import('express').Request} req - Express request
 * @returns {string} Request headers
 */
morgan.token('headers', (req) => {
  const headers = { ...req.headers };
  delete headers.authorization;
  return JSON.stringify(headers);
});

/**
 * Morgan token for response headers
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {string} Response headers
 */
morgan.token('res-headers', (req, res) => {
  return JSON.stringify(res.getHeaders());
});

/**
 * Morgan token for response body
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {string} Response body
 */
morgan.token('res-body', (req, res) => {
  if (res.body) {
    return JSON.stringify(res.body);
  }
  return '';
});

/**
 * Morgan token for error
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {string} Error message
 */
morgan.token('error', (req, res) => {
  return res.locals.error ? res.locals.error.message : '';
});

/**
 * Morgan token for error stack
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {string} Error stack
 */
morgan.token('error-stack', (req, res) => {
  return res.locals.error ? res.locals.error.stack : '';
});

/**
 * Morgan format for development
 */
const devFormat = ':request-id :method :url :status :response-time-ms ms - :res[content-length]';

/**
 * Morgan format for production
 */
const prodFormat = JSON.stringify({
  requestId: ':request-id',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  body: ':body',
  query: ':query',
  params: ':params',
  headers: ':headers',
  resHeaders: ':res-headers',
  resBody: ':res-body',
  error: ':error',
  errorStack: ':error-stack',
});

/**
 * Morgan middleware
 * @param {import('express').Application} app - Express application
 */
export const applyMorgan = (app) => {
  // Create a write stream for access logs
  const accessLogStream = createWriteStream(join(process.cwd(), 'logs', 'access.log'), {
    flags: 'a',
  });

  // Use morgan for HTTP request logging
  app.use(
    morgan(config.env === 'production' ? prodFormat : devFormat, {
      stream: accessLogStream,
      skip: (req, res) => res.statusCode >= 400,
    })
  );

  // Use morgan for HTTP error logging
  app.use(
    morgan(config.env === 'production' ? prodFormat : devFormat, {
      stream: createWriteStream(join(process.cwd(), 'logs', 'error.log'), {
        flags: 'a',
      }),
      skip: (req, res) => res.statusCode < 400,
    })
  );
};
