import express from 'express';
import request from 'supertest';

jest.unmock(require.resolve('../../../src/infrastructure/middleware/compression.js'));
const { applyCompression } = require('../../../src/infrastructure/middleware/compression.js');

const buildApp = () => {
  const app = express();
  applyCompression(app);
  app.get('/large', (_req, res) => {
    res.send('x'.repeat(5000));
  });
  return app;
};

describe('applyCompression', () => {
  const app = buildApp();

  it('compresses large responses', async () => {
    const res = await request(app).get('/large').set('Accept-Encoding', 'gzip').expect(200);
    expect(res.headers['content-encoding']).toBe('gzip');
  });
});
