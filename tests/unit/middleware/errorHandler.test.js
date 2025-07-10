// Mock @prisma/client to expose PrismaClientKnownRequestError
jest.mock('@prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    constructor(message, code, meta) {
      super(message);
      this.code = code;
      this.meta = meta;
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});

import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';

import {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  throwError,
} from '../../../src/infrastructure/middleware/errorHandler.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';
import { createError } from '../../../src/shared/utils/error.js';

const buildMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.headersSent = false;
  return res;
};

const buildMockReq = () => ({
  path: '/test',
  method: 'GET',
  body: {},
  query: {},
  params: {},
  originalUrl: '/test',
  requestId: 'test-123',
});

// Helper to properly link req and res
const linkReqRes = (req, res) => {
  res.req = req;
  return { req, res };
};

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles Prisma duplicate entry error (P2002)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('duplicate', 'P2002', {
      target: ['email'],
    });

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.CONFLICT,
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
        message: 'El recurso ya existe',
        error: expect.objectContaining({
          type: 'database',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              code: 'DUPLICATE_ENTRY',
              message: 'Valor duplicado',
            }),
          ]),
        }),
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles Prisma duplicate entry error (P2002) with unknown target', () => {
    const err = new Prisma.PrismaClientKnownRequestError('duplicate', 'P2002', {});

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'unknown',
              code: 'DUPLICATE_ENTRY',
              message: 'Valor duplicado',
            }),
          ]),
        }),
        requestId: 'test-123',
      })
    );
  });

  it('handles Prisma not found error (P2025)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('not found', 'P2025');

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.NOT_FOUND,
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Recurso no encontrado',
        error: expect.objectContaining({
          type: 'database',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'resource',
              code: 'NOT_FOUND',
              message: 'El recurso solicitado no existe',
            }),
          ]),
        }),
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles Prisma default case error', () => {
    const err = new Prisma.PrismaClientKnownRequestError('unknown prisma error', 'P9999');

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: API_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Error de base de datos',
        error: expect.objectContaining({
          type: 'database',
        }),
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles JWT invalid token error', () => {
    const err = new Error('Invalid token');
    err.name = 'JsonWebTokenError';

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.UNAUTHORIZED,
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Token de acceso inválido',
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles JWT expired token error', () => {
    const err = new Error('Token expired');
    err.name = 'TokenExpiredError';

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.UNAUTHORIZED,
        code: API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        message: 'Token de acceso expirado',
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles validation errors', () => {
    const err = new Error('Validation failed');
    err.type = 'validation';
    err.details = [{ field: 'email', message: 'Invalid email' }];

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        code: API_ERROR_CODES.VALIDATION_FAILED,
        message: 'Los datos enviados no son válidos',
        error: expect.objectContaining({
          type: 'validation',
          details: [{ field: 'email', message: 'Invalid email' }],
        }),
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles standard custom error created with createError', () => {
    const err = createError('Bad input', API_ERROR_CODES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.BAD_REQUEST,
        code: API_ERROR_CODES.INVALID_INPUT,
        message: 'Bad input',
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles Error objects with details', () => {
    const err = new Error('Custom error with details');
    err.details = [{ field: 'test', message: 'Test error' }];

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: API_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Custom error with details',
        error: expect.objectContaining({
          type: 'server',
          // The sanitizeResponse function converts arrays to objects with numeric keys
          details: expect.objectContaining({
            0: expect.objectContaining({
              field: 'test',
              message: 'Test error',
            }),
          }),
        }),
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('handles non-Error objects gracefully', () => {
    const err = { foo: 'bar' };

    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: API_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Error interno del servidor',
        timestamp: expect.any(String),
        requestId: 'test-123',
      })
    );
  });

  it('should delegate to next if headers already sent', () => {
    const err = new Error('Test error');
    const { req, res } = linkReqRes(buildMockReq(), buildMockRes());
    res.headersSent = true;

    const nextSpy = jest.fn();

    errorHandler(err, req, res, nextSpy);

    expect(nextSpy).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should handle requests without requestId', () => {
    const err = new Error('Test error');
    const req = buildMockReq();
    delete req.requestId;
    const { req: finalReq, res } = linkReqRes(req, buildMockRes());

    errorHandler(err, finalReq, res, () => {});

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        // When requestId is undefined, the response helper falls back to 'unknown'
        requestId: 'unknown',
      })
    );
  });
});

describe('throwError function', () => {
  it('should create and throw an error with provided parameters', () => {
    expect(() => {
      throwError('Test message', API_ERROR_CODES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, {
        field: 'test',
      });
    }).toThrow(
      expect.objectContaining({
        message: 'Test message',
        code: API_ERROR_CODES.VALIDATION_FAILED,
        status: HTTP_STATUS.BAD_REQUEST,
        details: { field: 'test' },
      })
    );
  });

  it('should create and throw an error with default details', () => {
    expect(() => {
      throwError('Test message', API_ERROR_CODES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST);
    }).toThrow(
      expect.objectContaining({
        message: 'Test message',
        code: API_ERROR_CODES.VALIDATION_FAILED,
        status: HTTP_STATUS.BAD_REQUEST,
      })
    );
  });
});

describe('asyncHandler function', () => {
  it('should handle successful async operations', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const req = buildMockReq();
    const res = buildMockRes();
    const next = jest.fn();

    const wrappedFn = asyncHandler(mockFn);
    await wrappedFn(req, res, next);

    expect(mockFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch and pass errors to next', async () => {
    const error = new Error('Async error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const req = buildMockReq();
    const res = buildMockRes();
    const next = jest.fn();

    const wrappedFn = asyncHandler(mockFn);
    await wrappedFn(req, res, next);

    expect(mockFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(console.error).toHaveBeenCalledWith('Async Handler Error:', expect.any(Object));
  });
});

describe('notFoundHandler function', () => {
  it('should handle 404 routes with proper error structure', () => {
    const req = { originalUrl: '/non-existent', method: 'GET' };
    const res = buildMockRes();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        status: HTTP_STATUS.NOT_FOUND,
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'La ruta /non-existent no existe',
        error: expect.objectContaining({
          type: 'routing',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'route',
              code: 'ROUTE_NOT_FOUND',
              message: 'El endpoint GET /non-existent no está disponible',
            }),
          ]),
        }),
        timestamp: expect.any(String),
        requestId: 'unknown',
      })
    );
  });
});
