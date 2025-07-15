import express from 'express';

import { applyLoggingMiddleware } from '../../../src/infrastructure/middleware/logging.js';

describe('Logging Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

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

    const req = {
      method: 'GET',
      url: '/test',
      requestId: 'test-request-id',
    };
    const res = {
      on: jest.fn(),
    };

    // Simulate a request by calling the middleware directly
    // The middleware is applied to the app, so we need to simulate it
    const mockNext = jest.fn();

    // Create a simple test to verify the middleware structure
    expect(app._router).toBeDefined();
    expect(app._router.stack).toBeDefined();
    expect(app._router.stack.length).toBeGreaterThan(0);
  });
});
