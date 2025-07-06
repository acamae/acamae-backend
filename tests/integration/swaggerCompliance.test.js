// Mock services for integration testing
jest.mock('../../src/application/services/AuthService.js', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
  };
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      register: jest.fn().mockResolvedValue({
        user: mockUser,
        emailSent: true,
        emailError: null,
      }),
      login: jest.fn().mockResolvedValue({
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
      getMe: jest.fn().mockResolvedValue(mockUser),
    })),
  };
});

jest.mock('../../src/application/services/UserService.js', () => {
  const mockUsers = [
    { id: 'user_1', email: 'user1@example.com', username: 'user1', role: 'user' },
    { id: 'user_2', email: 'user2@example.com', username: 'user2', role: 'admin' },
  ];
  return {
    UserService: jest.fn().mockImplementation(() => ({
      getAllUsers: jest.fn().mockResolvedValue({
        users: mockUsers,
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      }),
      getUserById: jest.fn().mockImplementation((id) => {
        return Promise.resolve(id === 'user_1' ? mockUsers[0] : null);
      }),
    })),
  };
});

// Mock middleware
jest.mock('../../src/infrastructure/middleware/validation.js', () => {
  const passthru = (req, _res, next) => next();
  return new Proxy({ __esModule: true, validateRequest: () => passthru }, { get: () => passthru });
});

jest.mock('../../src/infrastructure/middleware/auth.js', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'user_123', role: 'admin' };
    next();
  },
  authorize: () => (req, _res, next) => next(),
}));

import http from 'http';

import request from 'supertest';

import app from '../../src/infrastructure/app.js';

describe('Swagger Compliance Tests', () => {
  let server, agent;

  beforeAll((done) => {
    server = http.createServer(app);
    server.keepAliveTimeout = 0;

    const sockets = new Set();
    server.on('connection', (s) => {
      sockets.add(s);
      s.on('close', () => sockets.delete(s));
    });

    server.listen(0, () => {
      agent = request.agent(server);
      server.__sockets = sockets;
      done();
    });
  });

  afterAll((done) => {
    for (const s of server.__sockets) s.destroy();
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper function to validate API response structure
   */
  const validateApiResponseStructure = (response, expectedStatus) => {
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('status', expectedStatus);
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('requestId');

    // Validate types
    expect(typeof response.body.success).toBe('boolean');
    expect(typeof response.body.status).toBe('number');
    expect(typeof response.body.code).toBe('string');
    expect(typeof response.body.message).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.requestId).toBe('string');

    // Validate timestamp format (ISO 8601)
    expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Validate requestId format (UUID)
    expect(response.body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  };

  /**
   * Helper function to validate success response
   */
  const validateSuccessResponse = (response, expectedStatus = 200) => {
    validateApiResponseStructure(response, expectedStatus);
    expect(response.body.success).toBe(true);
    expect(response.body.code).toBe('SUCCESS');
  };

  describe('Auth Controller Swagger Compliance', () => {
    describe('POST /auth/login', () => {
      it('should return valid success response structure according to Swagger', async () => {
        const response = await agent
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'Password123!',
          })
          .set('Connection', 'close');

        validateSuccessResponse(response, 200);

        // Validate UserWithTokens structure per Swagger
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user).toHaveProperty('email');
        expect(response.body.data.user).toHaveProperty('username');
        expect(response.body.data.user).toHaveProperty('role');

        // Validate Spanish message
        expect(response.body.message).toBe('Login exitoso');
      });
    });

    describe('POST /auth/register', () => {
      it('should return valid success response structure according to Swagger', async () => {
        const response = await agent
          .post('/api/auth/register')
          .send({
            email: 'newuser@example.com',
            username: 'newuser',
            password: 'Password123!',
          })
          .set('Connection', 'close');

        validateSuccessResponse(response, 201);

        // According to Swagger, register returns data: null
        expect(response.body.data).toBe(null);

        // Validate Spanish message contains verification info
        expect(response.body.message).toContain('exitosamente');
        expect(response.body.message).toContain('correo');
      });
    });

    describe('GET /auth/me', () => {
      it('should return valid user response structure according to Swagger', async () => {
        const response = await agent
          .get('/api/auth/me')
          .set('Authorization', 'Bearer mock-token')
          .set('Connection', 'close');

        validateSuccessResponse(response, 200);

        // Validate User structure per Swagger
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('email');
        expect(response.body.data).toHaveProperty('username');
        expect(response.body.data).toHaveProperty('role');

        // Validate Spanish message
        expect(response.body.message).toBe('Usuario obtenido exitosamente');
      });
    });
  });

  describe('User Controller Swagger Compliance', () => {
    describe('GET /users', () => {
      it('should return valid paginated response structure according to Swagger', async () => {
        const response = await agent
          .get('/api/users?page=1&limit=10')
          .set('Authorization', 'Bearer admin-token')
          .set('Connection', 'close');

        validateSuccessResponse(response, 200);

        // Validate array of users
        expect(Array.isArray(response.body.data)).toBe(true);

        // Validate pagination metadata structure per Swagger
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('page');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('total');
        expect(response.body.meta.pagination).toHaveProperty('totalPages');
        expect(response.body.meta.pagination).toHaveProperty('hasNext');
        expect(response.body.meta.pagination).toHaveProperty('hasPrev');

        // Validate Spanish message
        expect(response.body.message).toBe('Usuarios obtenidos exitosamente');
      });
    });

    describe('GET /users/:id', () => {
      it('should return valid user response structure according to Swagger', async () => {
        const response = await agent
          .get('/api/users/user_1')
          .set('Authorization', 'Bearer admin-token')
          .set('Connection', 'close');

        validateSuccessResponse(response, 200);

        // Validate User structure per Swagger
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('email');
        expect(response.body.data).toHaveProperty('username');
        expect(response.body.data).toHaveProperty('role');

        // Validate Spanish message
        expect(response.body.message).toBe('Usuario obtenido exitosamente');
      });

      it('should return valid 404 error response according to Swagger', async () => {
        const response = await agent
          .get('/api/users/nonexistent')
          .set('Authorization', 'Bearer admin-token')
          .set('Connection', 'close');

        validateApiResponseStructure(response, 404);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBe(null);
        expect(response.body.code).toBe('RESOURCE_NOT_FOUND');

        // Validate Spanish error message
        expect(response.body.message).toContain('no existe');
      });
    });
  });

  describe('Response Structure Consistency', () => {
    it('should always include required fields in success responses', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .set('Connection', 'close');

      // All responses must have these exact fields per Swagger
      const requiredFields = [
        'success',
        'data',
        'status',
        'code',
        'message',
        'timestamp',
        'requestId',
      ];
      requiredFields.forEach((field) => {
        expect(response.body).toHaveProperty(field);
      });

      // Optional meta field should be present when relevant
      if (response.body.meta) {
        expect(typeof response.body.meta).toBe('object');
      }
    });

    it('should return consistent error structure', async () => {
      const response = await agent
        .get('/api/users/nonexistent')
        .set('Authorization', 'Bearer admin-token')
        .set('Connection', 'close');

      validateApiResponseStructure(response, 404);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBe(null);
      expect(response.body.code).toBe('RESOURCE_NOT_FOUND');

      // Error responses may have additional error object
      if (response.body.error) {
        expect(typeof response.body.error).toBe('object');
      }
    });
  });

  describe('Spanish Messages Validation', () => {
    it('should return all messages in Spanish', async () => {
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .set('Connection', 'close');

      // Success messages should be in Spanish
      expect(loginResponse.body.message).toMatch(/exitoso/);
      expect(loginResponse.body.message).not.toMatch(/successful|success/i);

      const errorResponse = await agent
        .get('/api/users/nonexistent')
        .set('Authorization', 'Bearer admin-token')
        .set('Connection', 'close');

      // Error messages should be in Spanish
      expect(errorResponse.body.message).toMatch(/no existe/);
      expect(errorResponse.body.message).not.toMatch(/not found|does not exist/i);
    });
  });
});
