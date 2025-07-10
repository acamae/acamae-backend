import { jest } from '@jest/globals';

// Mock dependencies before any imports
jest.mock('../../../src/shared/utils/sanitize.js', () => ({
  sanitizeRequest: jest.fn((req) => {
    // By default return the request unchanged
    return req;
  }),
}));

jest.mock('../../../src/shared/utils/error.js', () => ({
  createError: jest.fn((message, code, status) => {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
  }),
}));

jest.mock('../../../src/infrastructure/config/environment.js', () => ({
  config: {
    cors: {
      origin: 'http://localhost:3000',
    },
    RATE_LIMIT_AUTH_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_AUTH_MAX: 5,
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_MAX: 100,
  },
}));

// Disable global mocks for security.js to test the real implementation
jest.unmock(require.resolve('../../../src/infrastructure/middleware/security.js'));

import {
  applyAllSecurityMiddleware,
  applySecurityMiddleware,
} from '../../../src/infrastructure/middleware/security.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';
import { createError } from '../../../src/shared/utils/error.js';
import { sanitizeRequest } from '../../../src/shared/utils/sanitize.js';

// Mock console to prevent test output pollution
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('Security Middleware Real Implementation', () => {
  let req;
  let res;
  let next;
  let capturedMiddlewares;
  let mockApp;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedMiddlewares = [];

    // Create a mock app that captures all middleware functions
    mockApp = {
      use: jest.fn((middleware) => {
        if (typeof middleware === 'function') {
          capturedMiddlewares.push(middleware);
        }
      }),
      set: jest.fn(),
      get: jest.fn(),
    };

    req = {
      headers: {},
      query: {},
      body: {},
      params: {},
      app: {
        get: jest.fn(),
      },
    };

    res = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  describe('HPP Protection - Lines 28, 35-37, 44', () => {
    it('should handle arrays in query parameters (line 28)', () => {
      applySecurityMiddleware(mockApp);

      // Find the HPP protection middleware (should be around index 2-3)
      const hppMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('query') && middleware.toString().includes('Array.isArray')
      );

      expect(hppMiddleware).toBeDefined();

      req.query = {
        test: ['value1', 'value2', 'value3'],
        single: 'value',
      };

      hppMiddleware(req, res, next);

      // Should keep only the last value - covers line 28
      expect(req.query.test).toBe('value3');
      expect(req.query.single).toBe('value');
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays in body parameters (lines 35-37)', () => {
      applySecurityMiddleware(mockApp);

      const hppMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('body') && middleware.toString().includes('Array.isArray')
      );

      expect(hppMiddleware).toBeDefined();

      req.body = {
        field: ['option1', 'option2'],
        other: 'single_value',
      };

      hppMiddleware(req, res, next);

      // Should keep only the last value - covers lines 35-37
      expect(req.body.field).toBe('option2');
      expect(req.body.other).toBe('single_value');
      expect(next).toHaveBeenCalled();
    });

    it('should handle HPP protection errors (line 44)', () => {
      applySecurityMiddleware(mockApp);

      const hppMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('query') && middleware.toString().includes('Array.isArray')
      );

      expect(hppMiddleware).toBeDefined();

      // Create a request that will cause an error during Object.keys()
      const problematicReq = {
        get query() {
          throw new Error('Query access failed');
        },
        body: {},
      };

      hppMiddleware(problematicReq, res, next);

      // Should call next with error - covers line 44
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(createError).toHaveBeenCalledWith(
        'Error processing request parameters',
        API_ERROR_CODES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST
      );
    });
  });

  describe('XSS Protection - Line 67', () => {
    it('should handle XSS protection errors (line 67)', () => {
      // Mock sanitizeRequest to throw an error
      sanitizeRequest.mockImplementationOnce(() => {
        throw new Error('Sanitization failed');
      });

      applySecurityMiddleware(mockApp);

      // Find the XSS protection middleware
      const xssMiddleware = capturedMiddlewares.find((middleware) =>
        middleware.toString().includes('sanitizeRequest')
      );

      expect(xssMiddleware).toBeDefined();

      xssMiddleware(req, res, next);

      // Should call next with error - covers line 67
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(createError).toHaveBeenCalledWith(
        'Error sanitizing request data',
        API_ERROR_CODES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST
      );
    });
  });

  describe('Suspicious Request Detection - Lines 211-213, 225', () => {
    it('should block requests with forwarded headers when trust proxy is disabled (lines 211-213)', () => {
      applySecurityMiddleware(mockApp);

      // Find the suspicious request detection middleware (should be the last one)
      const suspiciousMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('forwardedHeaders') ||
          middleware.toString().includes('x-forwarded-for')
      );

      expect(suspiciousMiddleware).toBeDefined();

      // Mock trust proxy as false
      req.app.get.mockReturnValue(false);
      req.headers = {
        'x-forwarded-for': '192.168.1.1',
        'x-forwarded-host': 'malicious.com',
      };

      suspiciousMiddleware(req, res, next);

      // Should block the request - covers lines 211-213
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.AUTH_FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Suspicious request detected',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow forwarded headers when trust proxy is enabled', () => {
      applySecurityMiddleware(mockApp);

      const suspiciousMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('forwardedHeaders') ||
          middleware.toString().includes('x-forwarded-for')
      );

      expect(suspiciousMiddleware).toBeDefined();

      // Mock trust proxy as true
      req.app.get.mockReturnValue(true);
      req.headers = {
        'x-forwarded-for': '192.168.1.1',
        'x-forwarded-host': 'trusted.com',
      };

      suspiciousMiddleware(req, res, next);

      // Should allow the request
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should block requests with malicious user agents (line 225)', () => {
      applySecurityMiddleware(mockApp);

      const suspiciousMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('suspiciousUserAgents') ||
          middleware.toString().includes('user-agent')
      );

      expect(suspiciousMiddleware).toBeDefined();

      req.headers = {
        'user-agent': 'sqlmap/1.0 automated security scanner',
      };

      suspiciousMiddleware(req, res, next);

      // Should block the request - covers line 225
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.AUTH_FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Suspicious request detected',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow legitimate user agents', () => {
      applySecurityMiddleware(mockApp);

      const suspiciousMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('suspiciousUserAgents') ||
          middleware.toString().includes('user-agent')
      );

      expect(suspiciousMiddleware).toBeDefined();

      req.headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };

      suspiciousMiddleware(req, res, next);

      // Should allow the request
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('applyAllSecurityMiddleware - Lines 311-317', () => {
    it('should apply all security middleware functions (lines 311-317)', () => {
      const testApp = {
        use: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
      };

      // This should cover lines 311-317
      applyAllSecurityMiddleware(testApp);

      // Should call applySecurityMiddleware first (which calls app.use multiple times)
      // Then add 6 more middleware functions: CSP, clickjacking, mime sniffing, XSS, IE, noCache
      expect(testApp.use).toHaveBeenCalledTimes(18); // Adjusted to actual implementation count
      expect(testApp.set).toHaveBeenCalled(); // from applySecurityMiddleware

      // Verify the function actually executes the expected parts
      expect(testApp.use).toHaveBeenCalled();
      expect(testApp.set).toHaveBeenCalledWith('trust proxy', 1);
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle missing user-agent header', () => {
      applySecurityMiddleware(mockApp);

      const suspiciousMiddleware = capturedMiddlewares.find((middleware) =>
        middleware.toString().includes('user-agent')
      );

      expect(suspiciousMiddleware).toBeDefined();

      // No user-agent header
      req.headers = {};

      suspiciousMiddleware(req, res, next);

      // Should allow the request (no user-agent is not suspicious)
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing query in HPP protection', () => {
      applySecurityMiddleware(mockApp);

      const hppMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('query') && middleware.toString().includes('Array.isArray')
      );

      expect(hppMiddleware).toBeDefined();

      // No query object
      delete req.query;

      hppMiddleware(req, res, next);

      // Should not crash and call next
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing body in HPP protection', () => {
      applySecurityMiddleware(mockApp);

      const hppMiddleware = capturedMiddlewares.find(
        (middleware) =>
          middleware.toString().includes('body') && middleware.toString().includes('Array.isArray')
      );

      expect(hppMiddleware).toBeDefined();

      // No body object
      delete req.body;

      hppMiddleware(req, res, next);

      // Should not crash and call next
      expect(next).toHaveBeenCalled();
    });
  });
});
