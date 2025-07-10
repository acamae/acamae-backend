// Mock AuthService with simple implementation
jest.mock('../../src/application/services/AuthService.js', () => {
  const mockUser = { id: '1', email: 'test@example.com', username: 'test' };
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      register: jest.fn().mockResolvedValue({
        user: mockUser,
        emailSent: true,
        emailError: null,
      }),
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: mockUser,
      }),
      refreshToken: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token-789',
        refreshToken: 'new-refresh-token-101',
      }),
      logout: jest.fn().mockResolvedValue(true),
    })),
  };
});

jest.mock('../../src/infrastructure/middleware/compression.js', () => ({
  applyCompression: (app) => app.use((req, _res, next) => next()),
  compressionErrorHandler: (error, _req, _res, next) => next(error),
}));

jest.mock('../../src/infrastructure/middleware/validation.js', () => {
  const passthru = (req, _res, next) => next();
  return new Proxy(
    {
      __esModule: true,
      validateRequest: () => passthru,
    },
    {
      get: () => passthru,
    }
  );
});

// Mock prisma to avoid db connection from middleware
jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => ({})) };
});

import http from 'http';

import request from 'supertest';

import app from '../../src/infrastructure/app.js';
import { API_ROUTES } from '../../src/shared/constants/apiRoutes.js';

// Mock user data for tests
const mockUser = { id: '1', email: 'test@example.com', username: 'test' };

describe('Auth flow integration', () => {
  let server;
  let agent;

  beforeAll((done) => {
    server = http.createServer(app);
    server.keepAliveTimeout = 0;

    const sockets = new Set();
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

    server.listen(0, () => {
      agent = request.agent(server);
      server.__sockets = sockets;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      for (const socket of server.__sockets) {
        socket.destroy();
      }
      server.close(done);
    } else {
      done();
    }
  });

  it('should register, login, refresh token and logout successfully', async () => {
    const post = (url) => agent.post(url).set('Connection', 'close');

    // Register
    const registerRes = await post(API_ROUTES.AUTH.REGISTER)
      .send({ email: mockUser.email, username: mockUser.username, password: 'Password123!' })
      .expect(201);

    expect(registerRes.body.success).toBe(true);

    // Login
    const loginRes = await post(API_ROUTES.AUTH.LOGIN)
      .send({ email: mockUser.email, password: 'Password123!' })
      .expect(200);

    expect(loginRes.body.data).toHaveProperty('accessToken', 'access-token-123');
    expect(loginRes.body.data).toHaveProperty('refreshToken', 'refresh-token-456');

    // Refresh token
    const refreshRes = await post(API_ROUTES.AUTH.REFRESH_TOKEN)
      .send({ refreshToken: 'refresh-token-456' })
      .expect(200);

    expect(refreshRes.body.data).toHaveProperty('accessToken', 'new-access-token-789');
    expect(refreshRes.body.data).toHaveProperty('refreshToken', 'new-refresh-token-101');

    // Logout
    const logoutRes = await post(API_ROUTES.AUTH.LOGOUT)
      .send({ refreshToken: 'new-refresh-token-101' })
      .expect(200);

    expect(logoutRes.body.success).toBe(true);
  });
});
