import request from 'supertest';

import app from '../../src/infrastructure/app.js';
import { config } from '../../src/infrastructure/config/environment.js';

describe('GET /api/countries', () => {
  test('returns catalog with 200 and correct structure', async () => {
    const res = await request(app).get('/api/countries');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data.countries');
    expect(Array.isArray(res.body.data.countries)).toBe(true);
    if (res.body.data.countries.length) {
      expect(res.body.data.countries[0]).toHaveProperty('code');
      expect(res.body.data.countries[0]).toHaveProperty('name');
    }
  });

  test('sends no-store in development/local, cache headers in others', async () => {
    const res = await request(app).get('/api/countries');
    const cacheControl = res.headers['cache-control'] || '';
    if (config.env === 'development' || config.env === 'local') {
      expect(cacheControl.includes('no-store')).toBe(true);
    } else {
      expect(cacheControl.includes('max-age')).toBe(true);
    }
  });
});
