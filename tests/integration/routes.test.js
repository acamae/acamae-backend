import request from 'supertest';

import app from '../../src/infrastructure/app.js';
import { API_ROUTES } from '../../src/shared/constants/apiRoutes.js';

// Mock Prisma to avoid real DB connection in health check
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn().mockResolvedValue(1),
      $disconnect: jest.fn().mockResolvedValue(),
    })),
  };
});

describe('API routes integration', () => {
  describe('GET /api', () => {
    it('should return welcome payload', async () => {
      const res = await request(app).get(API_ROUTES.BASE).expect(200);
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body).toHaveProperty('data.version');
      expect(res.body).toHaveProperty('data.endpoints');
    });
  });

  describe('GET /api/health', () => {
    it('should report healthy server and database', async () => {
      const res = await request(app).get(API_ROUTES.HEALTH).expect(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('data.checks.server.status', 'healthy');
      expect(res.body).toHaveProperty('data.checks.database.status', 'healthy');
    });
  });
});
