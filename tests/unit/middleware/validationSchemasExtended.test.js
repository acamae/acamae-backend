// Limpiar cache y desactivar el mock global establecido en jest.setup.js
jest.resetModules();
jest.unmock(require.resolve('../../../src/infrastructure/middleware/validation.js'));

import {
  paginationValidation,
  registerValidation,
  teamValidation,
  updateUserValidation,
  validateRequest,
} from '../../../src/infrastructure/middleware/validation.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

const buildReq = (body = {}, query = {}) => ({ body, query });
const noopRes = {};
const nextFn = () => jest.fn();

describe('additional validation middleware scenarios', () => {
  it('validateRequest throws INVALID_SCHEMA for unknown schema', () => {
    const mw = validateRequest('nonexistent');
    const req = buildReq();
    const next = nextFn();
    mw(req, noopRes, next);
    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.INVALID_SCHEMA);
    expect(err.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it('registerValidation rejects weak password', () => {
    const req = buildReq({ email: 'test@example.com', password: 'weakpass', username: 'user_123' });
    const next = jest.fn();
    registerValidation(req, noopRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('teamValidation rejects invalid tag format', () => {
    const req = buildReq({ name: 'Dev Team', tag: 'dev', description: 'Team' });
    const next = jest.fn();
    teamValidation(req, noopRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('updateUserValidation rejects invalid role', () => {
    const req = buildReq({ role: 'superadmin' });
    const next = jest.fn();
    updateUserValidation(req, noopRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('paginationValidation converts strings to numbers', () => {
    const req = buildReq({ page: '2', limit: '10' });
    paginationValidation(req, noopRes, jest.fn());
    expect(req.body.page).toBe(2);
    expect(req.body.limit).toBe(10);
  });
});
