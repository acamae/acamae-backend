import { jest } from '@jest/globals';

import { responseHelpersMiddleware } from '../../../src/infrastructure/middleware/responseHelpers.js';
import { API_ERROR_CODES, API_SUCCESS_CODES } from '../../../src/shared/constants/apiCodes.js';

describe('API Response Structure Tests (Unit)', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      requestId: '12345678-1234-1234-1234-123456789012', // Mock requestId
    };
    res = {
      statusCode: 200, // Default HTTP status code that Express sets
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      req, // Reference back to req object (Express sets this)
    };
    next = jest.fn();

    // Apply response helpers middleware to attach apiSuccess and apiError methods
    responseHelpersMiddleware(req, res, next);
  });

  describe('Success Response Helper', () => {
    it('should create correct structure for successful responses', () => {
      const testData = { message: 'Test data' };
      const testMessage = 'Operation successful';

      res.apiSuccess(testData, testMessage);

      // apiSuccess uses res.statusCode, doesn't call res.status()
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        status: 200, // Uses res.statusCode
        code: API_SUCCESS_CODES.SUCCESS,
        message: testMessage,
        timestamp: expect.any(String),
        requestId: '12345678-1234-1234-1234-123456789012',
      });
    });

    it('should include meta when provided', () => {
      const testData = [{ id: 1, name: 'Test' }];
      const testMessage = 'List retrieved successfully';
      const testMeta = { pagination: { page: 1, total: 1 } };

      res.apiSuccess(testData, testMessage, testMeta);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: testData,
          message: testMessage,
          meta: testMeta,
        })
      );
    });

    it('should use res.statusCode for status field', () => {
      res.statusCode = 201; // Simulate Express setting custom status
      res.apiSuccess({ test: 'data' }, 'Created successfully');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.status).toBe(201);
    });

    it('should generate valid ISO timestamp', () => {
      res.apiSuccess({ test: 'data' }, 'Test message');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(jsonCall.timestamp).toISOString()).toBe(jsonCall.timestamp);
    });

    it('should use requestId from req object', () => {
      res.apiSuccess({ test: 'data' }, 'Test message');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.requestId).toBe('12345678-1234-1234-1234-123456789012');
    });

    it('should fallback to "unknown" when no requestId', () => {
      // Remove requestId to test fallback
      delete res.req.requestId;
      res.apiSuccess({ test: 'data' }, 'Test message');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.requestId).toBe('unknown');
    });
  });

  describe('Error Response Helper', () => {
    it('should create correct structure for error responses', () => {
      const errorDetails = {
        type: 'validation',
        details: [{ field: 'email', code: 'INVALID_FORMAT', message: 'Email invalid' }],
      };

      res.apiError(400, API_ERROR_CODES.VALIDATION_FAILED, 'Validation error', errorDetails);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        status: 400,
        code: API_ERROR_CODES.VALIDATION_FAILED,
        message: 'Validation error',
        timestamp: expect.any(String),
        requestId: '12345678-1234-1234-1234-123456789012',
        error: errorDetails,
      });
    });

    it('should work without error details', () => {
      res.apiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, 'Resource not found');

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: null,
          status: 404,
          code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Resource not found',
        })
      );

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('error');
    });

    it('should include meta when provided', () => {
      const errorMeta = { retryAfter: 30 };

      res.apiError(429, API_ERROR_CODES.AUTH_RATE_LIMIT, 'Rate limit exceeded', null, errorMeta);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: errorMeta,
        })
      );
    });
  });

  describe('Response Structure Validation', () => {
    it('should ensure success response has required fields', () => {
      res.apiSuccess({ test: 'data' }, 'Test message');

      const jsonCall = res.json.mock.calls[0][0];
      const requiredFields = [
        'success',
        'data',
        'status',
        'code',
        'message',
        'timestamp',
        'requestId',
      ];

      requiredFields.forEach((field) => {
        expect(jsonCall).toHaveProperty(field);
      });

      // Verify data types
      expect(typeof jsonCall.success).toBe('boolean');
      expect(typeof jsonCall.status).toBe('number');
      expect(typeof jsonCall.code).toBe('string');
      expect(typeof jsonCall.message).toBe('string');
      expect(typeof jsonCall.timestamp).toBe('string');
      expect(typeof jsonCall.requestId).toBe('string');
    });

    it('should ensure error response has required fields', () => {
      res.apiError(400, API_ERROR_CODES.VALIDATION_FAILED, 'Error message');

      const jsonCall = res.json.mock.calls[0][0];
      const requiredFields = [
        'success',
        'data',
        'status',
        'code',
        'message',
        'timestamp',
        'requestId',
      ];

      requiredFields.forEach((field) => {
        expect(jsonCall).toHaveProperty(field);
      });

      // Verify specific error response requirements
      expect(jsonCall.success).toBe(false);
      expect(jsonCall.data).toBeNull();
    });
  });

  describe('RequestId Consistency', () => {
    it('should use requestId from req object when available', () => {
      const customRequestId = '87654321-4321-4321-4321-210987654321';
      res.req.requestId = customRequestId;

      res.apiSuccess({ test: 'data' }, 'Test message');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.requestId).toBe(customRequestId);
    });

    it('should fallback to "unknown" when requestId not available', () => {
      // Remove the req object to test fallback
      res.req = {};

      res.apiSuccess({ test: 'data' }, 'Test message');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.requestId).toBe('unknown');
    });
  });

  describe('Middleware Integration', () => {
    it('should attach apiSuccess and apiError methods to response object', () => {
      expect(typeof res.apiSuccess).toBe('function');
      expect(typeof res.apiError).toBe('function');
    });

    it('should call next() when middleware is applied', () => {
      expect(next).toHaveBeenCalled();
    });

    it('should work with custom status codes set before calling apiSuccess', () => {
      res.statusCode = 201; // Simulate Express middleware setting status
      res.apiSuccess({ created: true }, 'Resource created');

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.status).toBe(201);
    });
  });
});
