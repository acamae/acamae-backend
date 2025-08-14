import request from 'supertest';

import app from '../../src/infrastructure/app.js';
import { config } from '../../src/infrastructure/config/environment.js';

describe('GET /api/timezones', () => {
  test('returns catalog with 200 and correct structure', async () => {
    const res = await request(app).get('/api/timezones');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data.timezones');
    expect(Array.isArray(res.body.data.timezones)).toBe(true);
  });

  test('sends no-store in development/local, cache headers in others', async () => {
    const res = await request(app).get('/api/timezones');
    const cacheControl = res.headers['cache-control'] || '';
    if (config.env === 'development' || config.env === 'local') {
      expect(cacheControl.includes('no-store')).toBe(true);
    } else {
      expect(cacheControl.includes('max-age')).toBe(true);
    }
  });
});
