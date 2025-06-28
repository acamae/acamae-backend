// Mock authentication & authorization middleware to always allow
jest.mock('../../src/infrastructure/middleware/auth.js', () => {
  const fakeUser = { id: '1', role: 'admin' };
  return {
    authenticate: (req, _res, next) => {
      req.user = fakeUser;
      next();
    },
    authorize: () => (req, _res, next) => next(),
    isAdmin: (req, _res, next) => next(),
    isManagerOrAdmin: (req, _res, next) => next(),
  };
});

// Mock services to return deterministic data
jest.mock('../../src/application/services/UserService.js', () => {
  return {
    UserService: jest.fn().mockImplementation(() => ({
      getAllUsers: jest.fn().mockResolvedValue([{ id: '1', username: 'u1' }]),
    })),
  };
});

jest.mock('../../src/application/services/TeamService.js', () => {
  return {
    TeamService: jest.fn().mockImplementation(() => ({
      getAllTeams: jest.fn().mockResolvedValue([{ id: '1', name: 'T1', tag: 'TAG' }]),
      createTeam: jest.fn().mockImplementation((data) => Promise.resolve({ id: '2', ...data })),
    })),
  };
});

// Mock Prisma again just in case
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

import request from 'supertest';

import app from '../../src/infrastructure/app.js';
import { API_ROUTES } from '../../src/shared/constants/apiRoutes.js';

describe('Protected routes with JWT (mocked)', () => {
  it('GET /api/users should return list when authenticated', async () => {
    const res = await request(app)
      .get(API_ROUTES.USERS.GET_ALL)
      .set('Authorization', 'Bearer fake')
      .expect(200);
    expect(res.body.data).toEqual([{ id: '1', username: 'u1' }]);
  });

  it('GET /api/teams should return list', async () => {
    const res = await request(app)
      .get(API_ROUTES.TEAMS.GET_ALL)
      .set('Authorization', 'Bearer fake')
      .expect(200);
    expect(res.body.data).toEqual([{ id: '1', name: 'T1', tag: 'TAG' }]);
  });

  it('POST /api/teams should create new team', async () => {
    const payload = { name: 'NewTeam', tag: 'NEW', ownerId: '1' };
    const res = await request(app)
      .post(API_ROUTES.TEAMS.CREATE)
      .set('Authorization', 'Bearer fake')
      .send(payload)
      .expect(201);
    expect(res.body.data).toMatchObject({ name: payload.name, tag: payload.tag });
  });
});
