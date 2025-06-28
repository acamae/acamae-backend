import express from 'express';
import request from 'supertest';

// Unmock the real security middleware for this test only
jest.unmock(require.resolve('../../../src/infrastructure/middleware/security.js'));

const { applySecurityMiddleware } = require('../../../src/infrastructure/middleware/security.js');

const buildApp = () => {
  const app = express();
  applySecurityMiddleware(app);
  app.get('/ping', (_req, res) => res.send('pong'));
  return app;
};

describe('applySecurityMiddleware', () => {
  const app = buildApp();

  it('sets security headers and returns 200', async () => {
    const res = await request(app).get('/ping').expect(200);
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-xss-protection']).toBeDefined();
    expect(res.headers['x-correlation-id']).toBeDefined();
  });
});
