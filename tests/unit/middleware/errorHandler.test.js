import { jest } from '@jest/globals';

import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';
import { createError } from '../../../src/shared/utils/error.js';

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

const { Prisma } = require('@prisma/client');

const { errorHandler } = require('../../../src/infrastructure/middleware/errorHandler.js');

const buildMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildMockReq = () => ({
  path: '/test',
  method: 'GET',
  body: {},
  query: {},
  params: {},
});

describe('errorHandler middleware', () => {
  it('handles Prisma duplicate entry error (P2002)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('duplicate', 'P2002', {
      target: ['email'],
    });

    const req = buildMockReq();
    const res = buildMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        code: API_ERROR_CODES.DUPLICATE_ENTRY,
      })
    );
  });

  it('handles Prisma not found error (P2025)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('not found', 'P2025');

    const req = buildMockReq();
    const res = buildMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
      })
    );
  });

  it('handles standard custom error created with createError', () => {
    const err = createError('Bad input', API_ERROR_CODES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);

    const req = buildMockReq();
    const res = buildMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: API_ERROR_CODES.INVALID_INPUT,
      })
    );
  });

  it('handles non-Error objects gracefully', () => {
    const err = { foo: 'bar' };

    const req = buildMockReq();
    const res = buildMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      })
    );
  });
});
