import express from 'express';
import request from 'supertest';

jest.mock('winston', () => {
  const logs = [];
  const mockWinston = {
    createLogger: () => ({
      info: (...args) => logs.push({ level: 'info', args }),
      error: (...args) => logs.push({ level: 'error', args }),
      add: () => {},
      log: () => {},
    }),
    format: {
      combine: () => {},
      timestamp: () => {},
      errors: () => {},
      json: () => {},
      colorize: () => {},
      simple: () => {},
    },
    transports: { Console: function () {}, File: function () {} },
  };

  // Expose both default and named exports to satisfy ESM/CJS interop
  return {
    __esModule: true,
    ...mockWinston,
    default: mockWinston,
  };
});

import { errorLogger, requestLogger } from '../../../src/infrastructure/middleware/logging.js';

const buildApp = () => {
  const app = express();
  app.use(requestLogger);
  app.get('/ok', (_req, res) => res.send('ok'));
  app.get('/fail', () => {
    throw new Error('boom');
  });
  app.use(errorLogger);
  return app;
};

describe('logging middlewares', () => {
  const app = buildApp();

  it('logs request and error', async () => {
    await request(app).get('/ok').expect(200);
    await request(app).get('/fail').expect(500);
  });
});
