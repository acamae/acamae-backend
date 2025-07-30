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
      register: jest.fn().mockResolvedValue(mockUser), // Ahora devuelve directamente el usuario creado
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
  const { createError } = require('../../src/shared/utils/error.js');
  const { API_ERROR_CODES } = require('../../src/shared/constants/apiCodes.js');
  const { HTTP_STATUS } = require('../../src/shared/constants/httpStatus.js');

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
        const user = mockUsers.find((u) => u.id === id);
        if (!user) {
          throw createError({
            message: 'The requested user does not exist',
            code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND,
            errorDetails: {
              type: 'business',
              details: [
                {
                  field: 'user',
                  code: 'NOT_FOUND',
                  message: `User id ${id} not found`,
                },
              ],
            },
          });
        }
        return Promise.resolve(user);
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
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('requestId');

    // Validate HTTP status separately (not in response body)
    expect(response.status).toBe(expectedStatus);

    // Validate types
    expect(typeof response.body.success).toBe('boolean');
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

        // Validate English message (according to official documentation)
        expect(response.body.message).toBe('Login successful');
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

        // According to updated Swagger, register returns the created user
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('email');
        expect(response.body.data).toHaveProperty('username');
        expect(response.body.data).toHaveProperty('role');

        // Validate English message contains verification info (according to official documentation)
        expect(response.body.message).toContain('successfully');
        expect(response.body.message).toContain('email');
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

        // Validate English message (according to official documentation)
        expect(response.body.message).toBe('User retrieved successfully');
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

        // Validate English message (according to official documentation)
        expect(response.body.message).toBe('Users retrieved successfully');
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

        // Validate English message (according to official documentation)
        expect(response.body.message).toBe('User retrieved successfully');
      });

      it('should return valid 404 error response according to Swagger', async () => {
        const response = await agent
          .get('/api/users/nonexistent')
          .set('Authorization', 'Bearer admin-token')
          .set('Connection', 'close')
          .expect(404);

        validateApiResponseStructure(response, 404);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBe(null);
        expect(response.body.code).toBe('RESOURCE_NOT_FOUND');

        // Validate English error message (according to official documentation)
        expect(response.body.message).toBe('The requested user does not exist');
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
      const requiredFields = ['success', 'data', 'code', 'message', 'timestamp', 'requestId'];
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
        .set('Connection', 'close')
        .expect(404);

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

  describe('English Messages Validation', () => {
    it('should return all messages in English (according to official documentation)', async () => {
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .set('Connection', 'close');

      // Success messages should be in English
      expect(loginResponse.body.message).toMatch(/successful/);
      expect(loginResponse.body.message).not.toMatch(/exitoso/i);

      const errorResponse = await agent
        .get('/api/users/nonexistent')
        .set('Authorization', 'Bearer admin-token')
        .set('Connection', 'close')
        .expect(404);

      // Error messages should be in English
      expect(errorResponse.body.message).toBe('The requested user does not exist');
      expect(errorResponse.body.message).not.toMatch(/no existe/);
    });
  });
});
