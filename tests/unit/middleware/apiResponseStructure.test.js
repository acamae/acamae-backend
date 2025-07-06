import express from 'express';
import request from 'supertest';

import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  responseHelpersMiddleware,
} from '../../../src/infrastructure/middleware/index.js';
import { API_ERROR_CODES, API_SUCCESS_CODES } from '../../../src/shared/constants/apiCodes.js';

describe('API Response Structure Tests', () => {
  let app;

  beforeEach(() => {
    app = express();

    // Apply necessary middleware
    app.use(requestIdMiddleware);
    app.use(responseHelpersMiddleware);

    // Test routes
    app.get('/test/success', (req, res) => {
      res.apiSuccess({ message: 'Test data' }, 'Operación exitosa');
    });

    app.get('/test/success-with-meta', (req, res) => {
      res.apiSuccess([{ id: 1, name: 'Test' }], 'Lista obtenida exitosamente', {
        pagination: { page: 1, total: 1 },
      });
    });

    app.get('/test/error', (req, res) => {
      res.apiError(400, API_ERROR_CODES.VALIDATION_FAILED, 'Error de validación', {
        type: 'validation',
        details: [{ field: 'email', code: 'INVALID_FORMAT', message: 'Email inválido' }],
      });
    });

    app.get('/test/throw-error', (req, res, next) => {
      const error = new Error('Error de prueba');
      error.code = API_ERROR_CODES.AUTH_FORBIDDEN;
      error.status = 403;
      next(error);
    });

    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  describe('Success Responses', () => {
    it('should return correct structure for successful responses', async () => {
      const response = await request(app).get('/test/success').expect(200);

      // Verify exact structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data', { message: 'Test data' });
      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('code', API_SUCCESS_CODES.SUCCESS);
      expect(response.body).toHaveProperty('message', 'Operación exitosa');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      // Verify data types
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.status).toBe('number');
      expect(typeof response.body.code).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');

      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);

      // Verify requestId is UUID format
      expect(response.body.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should include meta when provided', async () => {
      const response = await request(app).get('/test/success-with-meta').expect(200);

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toEqual({ pagination: { page: 1, total: 1 } });
    });

    it('should include X-Request-ID header', async () => {
      const response = await request(app).get('/test/success').expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });

  describe('Error Responses', () => {
    it('should return correct structure for error responses', async () => {
      const response = await request(app).get('/test/error').expect(400);

      // Verify exact structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('code', API_ERROR_CODES.VALIDATION_FAILED);
      expect(response.body).toHaveProperty('message', 'Error de validación');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('error');

      // Verify error details structure
      expect(response.body.error).toHaveProperty('type', 'validation');
      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details[0]).toEqual({
        field: 'email',
        code: 'INVALID_FORMAT',
        message: 'Email inválido',
      });

      // Verify data types
      expect(typeof response.body.success).toBe('boolean');
      expect(response.body.data).toBeNull();
      expect(typeof response.body.status).toBe('number');
    });

    it('should handle thrown errors correctly', async () => {
      const response = await request(app).get('/test/throw-error').expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('status', 403);
      expect(response.body).toHaveProperty('code', API_ERROR_CODES.AUTH_FORBIDDEN);
      expect(response.body).toHaveProperty('message', 'Error de prueba');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
    });

    it('should handle 404 errors correctly', async () => {
      const response = await request(app).get('/nonexistent-route').expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('code', API_ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('/nonexistent-route');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.type).toBe('routing');
    });
  });

  describe('RequestId Consistency', () => {
    it('should use provided X-Request-ID header', async () => {
      const customRequestId = '12345678-1234-1234-1234-123456789012';

      const response = await request(app)
        .get('/test/success')
        .set('X-Request-ID', customRequestId)
        .expect(200);

      expect(response.body.requestId).toBe(customRequestId);
      expect(response.headers['x-request-id']).toBe(customRequestId);
    });

    it('should generate UUID when no header provided', async () => {
      const response = await request(app).get('/test/success').expect(200);

      expect(response.body.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('Error Codes Validation', () => {
    it('should have all required error codes available', () => {
      const requiredCodes = [
        'AUTH_INVALID_CREDENTIALS',
        'AUTH_USER_ALREADY_EXISTS',
        'AUTH_USER_ALREADY_VERIFIED',
        'AUTH_NO_ACTIVE_SESSION',
        'AUTH_TOKEN_EXPIRED',
        'AUTH_TOKEN_INVALID',
        'AUTH_TOKEN_ALREADY_USED',
        'AUTH_TOKEN_REVOKED',
        'AUTH_TOKEN_MALICIOUS',
        'AUTH_TOKEN_OTHER_FLOW',
        'AUTH_FORBIDDEN',
        'AUTH_UPDATE_FAILED',
        'VALIDATION_FAILED',
        'RESOURCE_NOT_FOUND',
        'ERR_NETWORK',
        'ERR_CANCELED',
        'ECONNABORTED',
        'ETIMEDOUT',
        'UNKNOWN_ERROR',
        'AUTH_RATE_LIMIT',
        'SERVICE_UNAVAILABLE',
        'AUTH_USER_NOT_FOUND',
        'AUTH_USER_BLOCKED',
      ];

      requiredCodes.forEach((code) => {
        expect(API_ERROR_CODES).toHaveProperty(code);
        expect(typeof API_ERROR_CODES[code]).toBe('string');
      });
    });
  });
});
