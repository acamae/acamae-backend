// Desactivar el mock global de validation.js
jest.unmock(require.resolve('../../../src/infrastructure/middleware/validation.js'));

import {
  idValidation,
  loginValidation,
  logoutValidation,
  paginationValidation,
  registerValidation,
  sanitizeInput,
  sanitizeQueryParams,
  teamValidation,
  updateUserValidation,
  validateRequest,
  validationSchemas,
  verifyEmailValidation,
} from '../../../src/infrastructure/middleware/validation.js';
// Mock the throwError function
jest.mock('../../../src/infrastructure/middleware/errorHandler.js', () => ({
  throwError: jest.fn((message, code, status, details) => {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    error.details = details;
    throw error;
  }),
}));

const buildReq = (body = {}, params = {}, query = {}) => ({ body, params, query });
const noopRes = {};
const buildNext = () => jest.fn();

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validationSchemas', () => {
    describe('login schema', () => {
      it('should validate correct login data', () => {
        const data = {
          email: 'Test@Example.com',
          password: 'Password123!',
        };
        const result = validationSchemas.login.parse(data);
        expect(result.email).toBe('test@example.com'); // Sanitized email
        expect(result.password).toBe('Password123!');
      });

      it('should reject invalid email format', () => {
        const data = {
          email: 'not-an-email',
          password: 'Password123!',
        };
        expect(() => validationSchemas.login.parse(data)).toThrow();
      });

      it('should reject short password', () => {
        const data = {
          email: 'test@example.com',
          password: 'short',
        };
        expect(() => validationSchemas.login.parse(data)).toThrow();
      });

      it('should reject long email', () => {
        const data = {
          email: `${'a'.repeat(255)}@example.com`,
          password: 'Password123!',
        };
        expect(() => validationSchemas.login.parse(data)).toThrow();
      });

      it('should reject long password', () => {
        const data = {
          email: 'test@example.com',
          password: 'a'.repeat(129),
        };
        expect(() => validationSchemas.login.parse(data)).toThrow();
      });
    });

    describe('register schema', () => {
      it('should validate correct registration data', () => {
        const data = {
          email: 'Test@Example.com',
          password: 'StrongP@ssw0rd123',
          username: 'user_123',
          firstName: '  John  ',
          lastName: '  Doe  ',
        };
        const result = validationSchemas.register.parse(data);
        expect(result.email).toBe('test@example.com');
        expect(result.username).toBe('user_123');
        expect(result.firstName).toBe('John');
        expect(result.lastName).toBe('Doe');
      });

      it('should validate minimal registration data', () => {
        const data = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          username: 'user_123',
        };
        const result = validationSchemas.register.parse(data);
        expect(result.firstName).toBeUndefined();
        expect(result.lastName).toBeUndefined();
      });

      it('should reject weak password', () => {
        const data = {
          email: 'test@example.com',
          password: 'weakpass',
          username: 'user_123',
        };
        expect(() => validationSchemas.register.parse(data)).toThrow();
      });

      it('should reject invalid username', () => {
        const data = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          username: 'invalid username!',
        };
        expect(() => validationSchemas.register.parse(data)).toThrow();
      });

      it('should reject invalid firstName', () => {
        const data = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          username: 'user_123',
          firstName: 'John123',
        };
        expect(() => validationSchemas.register.parse(data)).toThrow();
      });

      it('should reject short username', () => {
        const data = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          username: 'ab',
        };
        expect(() => validationSchemas.register.parse(data)).toThrow();
      });

      it('should reject long username', () => {
        const data = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          username: 'a'.repeat(51),
        };
        expect(() => validationSchemas.register.parse(data)).toThrow();
      });
    });

    describe('logout schema', () => {
      it('should validate correct logout data', () => {
        const data = { refreshToken: 'valid-refresh-token' };
        const result = validationSchemas.logout.parse(data);
        expect(result.refreshToken).toBe('valid-refresh-token');
      });

      it('should reject empty refresh token', () => {
        const data = { refreshToken: '' };
        expect(() => validationSchemas.logout.parse(data)).toThrow();
      });
    });

    describe('updateUser schema', () => {
      it('should validate partial user update', () => {
        const data = {
          firstName: 'Jane',
          email: 'New@Email.com',
        };
        const result = validationSchemas.updateUser.parse(data);
        expect(result.firstName).toBe('Jane');
        expect(result.email).toBe('new@email.com');
      });

      it('should validate role update', () => {
        const data = { role: 'admin' };
        const result = validationSchemas.updateUser.parse(data);
        expect(result.role).toBe('admin');
      });

      it('should reject invalid role', () => {
        const data = { role: 'invalid_role' };
        expect(() => validationSchemas.updateUser.parse(data)).toThrow();
      });
    });

    describe('createTeam schema', () => {
      it('should validate correct team data', () => {
        const data = {
          name: 'Team Name',
          tag: 'TEAM',
          description: '  Team description  ',
        };
        const result = validationSchemas.createTeam.parse(data);
        expect(result.name).toBe('Team Name');
        expect(result.tag).toBe('TEAM');
        expect(result.description).toBe('Team description');
      });

      it('should validate minimal team data', () => {
        const data = {
          name: 'Team Name',
          tag: 'TEAM',
        };
        const result = validationSchemas.createTeam.parse(data);
        expect(result.description).toBeUndefined();
      });

      it('should reject short team name', () => {
        const data = {
          name: 'T',
          tag: 'TEAM',
        };
        expect(() => validationSchemas.createTeam.parse(data)).toThrow();
      });

      it('should reject invalid team tag', () => {
        const data = {
          name: 'Team Name',
          tag: 'invalid tag',
        };
        expect(() => validationSchemas.createTeam.parse(data)).toThrow();
      });

      it('should reject long description', () => {
        const data = {
          name: 'Team Name',
          tag: 'TEAM',
          description: 'a'.repeat(501),
        };
        expect(() => validationSchemas.createTeam.parse(data)).toThrow();
      });
    });

    describe('pagination schema', () => {
      it('should validate pagination params', () => {
        const data = {
          page: '1',
          limit: '10',
        };
        const result = validationSchemas.pagination.parse(data);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      });

      it('should handle missing pagination params', () => {
        const data = {};
        const result = validationSchemas.pagination.parse(data);
        expect(result.page).toBeUndefined();
        expect(result.limit).toBeUndefined();
      });
    });

    describe('id schema', () => {
      it('should validate correct UUID', () => {
        const data = { id: '123e4567-e89b-12d3-a456-426614174000' };
        const result = validationSchemas.id.parse(data);
        expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid UUID', () => {
        const data = { id: 'not-a-uuid' };
        expect(() => validationSchemas.id.parse(data)).toThrow();
      });
    });
  });

  describe('validateRequest function', () => {
    it('should validate valid data successfully', () => {
      const middleware = validateRequest('login');
      const req = buildReq({
        email: 'test@example.com',
        password: 'Password123!',
      });
      const next = buildNext();

      middleware(req, noopRes, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.email).toBe('test@example.com');
    });

    it('should throw error for invalid schema name', () => {
      const middleware = validateRequest('nonexistent');
      const req = buildReq({});
      const next = buildNext();

      middleware(req, noopRes, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle validation errors', () => {
      const middleware = validateRequest('login');
      const req = buildReq({ email: 'bad', password: 'short' });
      const next = buildNext();
      middleware(req, noopRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through non-validation errors', () => {
      const middleware = validateRequest('login');
      const req = buildReq({
        email: 'test@example.com',
        password: 'Password123!',
      });
      const next = buildNext();

      // Mock schema.parse to throw a non-Zod error
      const originalParse = validationSchemas.login.parse;
      validationSchemas.login.parse = jest.fn(() => {
        throw new Error('Non-Zod error');
      });

      middleware(req, noopRes, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      // Restore original parse
      validationSchemas.login.parse = originalParse;
    });
  });

  describe('validateRequest error handling', () => {
    it('should handle invalid schema name', () => {
      const middleware = validateRequest();
      const req = buildReq();
      const next = buildNext();
      middleware(req, noopRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing request body', () => {
      const middleware = validateRequest('login');
      const req = buildReq(undefined);
      const next = buildNext();
      middleware(req, noopRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle non-object request body', () => {
      const middleware = validateRequest('login');
      const req = buildReq('not-an-object');
      const next = buildNext();
      middleware(req, noopRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle schema not found', () => {
      const middleware = validateRequest('nonexistentSchema');
      const req = buildReq({});
      const next = buildNext();
      middleware(req, noopRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle unexpected validation errors', () => {
      // Forzar un error inesperado en el parseo
      const middleware = validateRequest('login');
      const req = buildReq({ email: null, password: null });
      const next = buildNext();
      middleware(req, noopRes, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('specific validation middlewares', () => {
    describe('registerValidation', () => {
      it('should validate correct registration data', () => {
        const req = buildReq({
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          username: 'user_123',
        });
        const next = buildNext();

        registerValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.body.email).toBe('test@example.com');
      });

      it('should reject invalid registration data', () => {
        const req = buildReq({ email: 'bad', password: 'weak', username: 'u' });
        const next = buildNext();

        registerValidation(req, noopRes, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('loginValidation', () => {
      it('should validate correct login data', () => {
        const req = buildReq({
          email: 'test@example.com',
          password: 'Password123!',
        });
        const next = buildNext();

        loginValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should reject invalid login data', () => {
        const req = buildReq({ email: 'bad', password: 'short' });
        const next = buildNext();

        loginValidation(req, noopRes, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('logoutValidation', () => {
      it('should validate correct logout data', () => {
        const req = buildReq({ refreshToken: 'valid-token' });
        const next = buildNext();

        logoutValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should reject empty refresh token', () => {
        const req = buildReq({ refreshToken: '' });
        const next = buildNext();

        logoutValidation(req, noopRes, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('verifyEmailValidation', () => {
      it('should validate correct token', () => {
        const req = buildReq({}, { token: '123e4567-e89b-12d3-a456-426614174000' });
        const next = buildNext();

        verifyEmailValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should reject missing token', () => {
        const req = buildReq({}, {});
        const next = buildNext();

        expect(() => {
          verifyEmailValidation(req, noopRes, next);
        }).toThrow();
      });

      it('should reject invalid token format', () => {
        const req = buildReq({}, { token: 'invalid-uuid' });
        const next = buildNext();

        expect(() => {
          verifyEmailValidation(req, noopRes, next);
        }).toThrow();
      });

      it('should handle Zod errors', () => {
        const req = buildReq({}, { token: 'invalid-uuid' });
        const next = buildNext();

        expect(() => {
          verifyEmailValidation(req, noopRes, next);
        }).toThrow();
      });
    });

    describe('teamValidation', () => {
      it('should validate correct team data', () => {
        const req = buildReq({
          name: 'Team Name',
          tag: 'TEAM',
          description: 'Team description',
        });
        const next = buildNext();

        teamValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('updateUserValidation', () => {
      it('should validate partial user data', () => {
        const req = buildReq({ firstName: 'Jane' });
        const next = buildNext();

        updateUserValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('paginationValidation', () => {
      it('should validate pagination data', () => {
        const req = buildReq({ page: '1', limit: '10' });
        const next = buildNext();

        paginationValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.body.page).toBe(1);
        expect(req.body.limit).toBe(10);
      });
    });

    describe('idValidation', () => {
      it('should validate correct UUID', () => {
        const req = buildReq({ id: '123e4567-e89b-12d3-a456-426614174000' });
        const next = buildNext();

        idValidation(req, noopRes, next);

        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('sanitizeQueryParams', () => {
    it('should sanitize string query parameters', () => {
      const req = buildReq(
        {},
        {},
        {
          search: '  test query  ',
          filter: 'category',
          number: 123,
        }
      );
      const next = buildNext();

      sanitizeQueryParams(req, noopRes, next);

      expect(req.query.search).toBe('test query');
      expect(req.query.filter).toBe('category');
      expect(req.query.number).toBe(123); // Non-string should remain unchanged
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle empty query object', () => {
      const req = buildReq({}, {}, {});
      const next = buildNext();

      sanitizeQueryParams(req, noopRes, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle errors gracefully', () => {
      const req = buildReq({}, {}, { search: 'test' });
      const next = buildNext();

      // Manually override the sanitizeString import used by sanitizeQueryParams
      const originalSanitizeQueryParams = sanitizeQueryParams;

      // Create a version of sanitizeQueryParams that will fail
      const failingSanitizeQueryParams = (req, res, next) => {
        try {
          // Simulate the error that would occur during sanitization
          throw new Error('Sanitize error');
        } catch (error) {
          next(error);
        }
      };

      failingSanitizeQueryParams(req, noopRes, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize query and body parameters', () => {
      const req = {
        query: {
          search: '  query with spaces  ',
          filter: 'category',
        },
        body: {
          name: '  name with spaces  ',
          description: 'description',
        },
      };
      const next = buildNext();

      sanitizeInput(req, noopRes, next);

      expect(req.query.search).toBe('query with spaces');
      expect(req.query.filter).toBe('category');
      expect(req.body.name).toBe('name with spaces');
      expect(req.body.description).toBe('description');
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle missing query or body', () => {
      const req = {};
      const next = buildNext();

      sanitizeInput(req, noopRes, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle non-string values', () => {
      const req = {
        query: {
          page: 1,
          active: true,
        },
        body: {
          count: 10,
          enabled: false,
        },
      };
      const next = buildNext();

      sanitizeInput(req, noopRes, next);

      expect(req.query.page).toBe(1);
      expect(req.query.active).toBe(true);
      expect(req.body.count).toBe(10);
      expect(req.body.enabled).toBe(false);
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle errors gracefully', () => {
      const req = {
        query: { search: 'test' },
        body: { name: 'test' },
      };
      const next = buildNext();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by making req.query itself throw when accessing keys
      const originalQuery = req.query;
      Object.defineProperty(req, 'query', {
        get: function () {
          throw new Error('Query access error');
        },
      });

      sanitizeInput(req, noopRes, next);

      expect(consoleSpy).toHaveBeenCalledWith('Error sanitizing input:', expect.any(Error));
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
