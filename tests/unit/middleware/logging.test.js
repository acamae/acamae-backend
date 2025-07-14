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
    };
    const res = {
      on: jest.fn(),
    };

    // Simulate a request
    const middleware = app._router.stack.find((layer) => layer.name === 'bound dispatch');
    if (middleware) {
      middleware.handle(req, res, () => {});
    }

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
  });
});
