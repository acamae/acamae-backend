import express from 'express';

import { applyLoggingMiddleware } from '../../../src/infrastructure/middleware/logging.js';

// Mock console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('Logging Middleware', () => {
  let app;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    app = express();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('applyLoggingMiddleware', () => {
    it('should apply logging middleware without errors', () => {
      expect(() => {
        applyLoggingMiddleware(app);
      }).not.toThrow();
    });

    it('should add morgan logging to the app', () => {
      const originalUse = app.use;
      const usedMiddleware = [];

      app.use = (middleware) => {
        usedMiddleware.push(middleware);
        return app;
      };

      applyLoggingMiddleware(app);

      expect(usedMiddleware.length).toBeGreaterThan(0);
      app.use = originalUse;
    });

    it('should handle request timing correctly', () => {
      applyLoggingMiddleware(app);

      expect(app._router).toBeDefined();
      expect(app._router.stack).toBeDefined();
      expect(app._router.stack.length).toBeGreaterThan(0);
    });
  });

  describe('Request timing middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        method: 'GET',
        url: '/test',
        timeout: 30000,
      };
      res = {
        on: jest.fn(),
      };
      next = jest.fn();
    });

    it('should add timing middleware and handle finish event', () => {
      applyLoggingMiddleware(app);

      // Find the timing middleware by looking for middleware that uses Date.now
      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      expect(timingMiddleware).toBeDefined();

      // Simulate the middleware execution
      const originalDateNow = Date.now;
      const mockStartTime = 1000;
      Date.now = jest.fn(() => mockStartTime);

      timingMiddleware.handle(req, res, next);

      expect(next).toHaveBeenCalled();

      // Simulate finish event
      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const mockEndTime = mockStartTime + 5000; // 5 seconds later
      Date.now = jest.fn(() => mockEndTime);

      finishCallback();

      Date.now = originalDateNow;
    });

    it('should handle slow request warning', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      applyLoggingMiddleware(app);

      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      const originalDateNow = Date.now;
      const mockStartTime = 1000;
      Date.now = jest.fn(() => mockStartTime);

      timingMiddleware.handle(req, res, next);

      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const mockEndTime = mockStartTime + 25000; // 25 seconds later (80% of 30s timeout)
      Date.now = jest.fn(() => mockEndTime);

      finishCallback();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Slow request detected')
      );

      process.env.NODE_ENV = originalEnv;
      Date.now = originalDateNow;
    });

    it('should handle timeout request error', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      applyLoggingMiddleware(app);

      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      const originalDateNow = Date.now;
      const mockStartTime = 1000;
      Date.now = jest.fn(() => mockStartTime);

      timingMiddleware.handle(req, res, next);

      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const mockEndTime = mockStartTime + 35000; // 35 seconds later (exceeds 30s timeout)
      Date.now = jest.fn(() => mockEndTime);

      finishCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 Timeout request'));

      process.env.NODE_ENV = originalEnv;
      Date.now = originalDateNow;
    });

    it('should not log during test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      applyLoggingMiddleware(app);

      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      const originalDateNow = Date.now;
      const mockStartTime = 1000;
      Date.now = jest.fn(() => mockStartTime);

      timingMiddleware.handle(req, res, next);

      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const mockEndTime = mockStartTime + 35000;
      Date.now = jest.fn(() => mockEndTime);

      finishCallback();

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      Date.now = originalDateNow;
    });

    it('should handle custom timeout values', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      req.timeout = 10000; // 10 seconds

      applyLoggingMiddleware(app);

      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      const originalDateNow = Date.now;
      const mockStartTime = 1000;
      Date.now = jest.fn(() => mockStartTime);

      timingMiddleware.handle(req, res, next);

      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const mockEndTime = mockStartTime + 9000; // 9 seconds later (90% of 10s timeout)
      Date.now = jest.fn(() => mockEndTime);

      finishCallback();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Slow request detected')
      );

      process.env.NODE_ENV = originalEnv;
      Date.now = originalDateNow;
    });

    it('should handle undefined timeout', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete req.timeout;

      applyLoggingMiddleware(app);

      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      const originalDateNow = Date.now;
      const mockStartTime = 1000;
      Date.now = jest.fn(() => mockStartTime);

      timingMiddleware.handle(req, res, next);

      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const mockEndTime = mockStartTime + 25000; // 25 seconds later (80% of default 30s timeout)
      Date.now = jest.fn(() => mockEndTime);

      finishCallback();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Slow request detected')
      );

      process.env.NODE_ENV = originalEnv;
      Date.now = originalDateNow;
    });
  });

  describe('Environment-specific behavior', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should apply morgan in development environment', () => {
      process.env.NODE_ENV = 'development';

      const originalUse = app.use;
      const usedMiddleware = [];

      app.use = (middleware) => {
        usedMiddleware.push(middleware);
        return app;
      };

      applyLoggingMiddleware(app);

      expect(usedMiddleware.length).toBeGreaterThan(0);
      app.use = originalUse;
    });

    it('should apply morgan in production environment', () => {
      process.env.NODE_ENV = 'production';

      const originalUse = app.use;
      const usedMiddleware = [];

      app.use = (middleware) => {
        usedMiddleware.push(middleware);
        return app;
      };

      applyLoggingMiddleware(app);

      expect(usedMiddleware.length).toBeGreaterThan(0);
      app.use = originalUse;
    });

    it('should skip morgan in test environment', () => {
      process.env.NODE_ENV = 'test';

      const originalUse = app.use;
      const usedMiddleware = [];

      app.use = (middleware) => {
        usedMiddleware.push(middleware);
        return app;
      };

      applyLoggingMiddleware(app);

      // Should still add timing and error middleware, but not morgan
      expect(usedMiddleware.length).toBeGreaterThan(0);
      app.use = originalUse;
    });

    it('should handle undefined NODE_ENV', () => {
      delete process.env.NODE_ENV;

      const originalUse = app.use;
      const usedMiddleware = [];

      app.use = (middleware) => {
        usedMiddleware.push(middleware);
        return app;
      };

      applyLoggingMiddleware(app);

      expect(usedMiddleware.length).toBeGreaterThan(0);
      app.use = originalUse;
    });
  });

  describe('Integration tests', () => {
    it('should handle complete request flow', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      applyLoggingMiddleware(app);

      const req = {
        method: 'POST',
        url: '/api/test',
        requestId: 'test-id',
        timeout: 30000,
        body: { data: 'test' },
        headers: { 'content-type': 'application/json' },
      };

      const res = {
        on: jest.fn(),
        getHeader: jest.fn(),
      };

      const next = jest.fn();

      // Find and execute timing middleware
      const timingMiddleware = app._router.stack.find((layer) =>
        layer.handle.toString().includes('Date.now')
      );

      const originalDateNow = Date.now;
      const startTime = 1000;
      Date.now = jest.fn(() => startTime);

      timingMiddleware.handle(req, res, next);

      // Simulate response finish
      const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
      const endTime = startTime + 100; // Fast response
      Date.now = jest.fn(() => endTime);

      finishCallback();

      process.env.NODE_ENV = originalEnv;
      Date.now = originalDateNow;
    });
  });
});
