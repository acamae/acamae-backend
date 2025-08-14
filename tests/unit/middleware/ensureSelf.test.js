import { ensureSelfParam } from '../../../src/infrastructure/middleware/ensureSelf.js';

describe('ensureSelfParam middleware', () => {
  const createReq = (paramId, userId) => ({
    params: { id: String(paramId) },
    user: { id: String(userId) },
  });
  const res = {};

  test('allows when params.id equals req.user.id', () => {
    const next = jest.fn();
    const req = createReq(123, 123);
    ensureSelfParam('id')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('blocks when params.id differs from req.user.id', () => {
    const next = jest.fn();
    const req = createReq(123, 456);
    ensureSelfParam('id')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeTruthy();
    expect(err.status).toBe(403);
    expect(err.code).toBe('AUTH_FORBIDDEN');
  });

  test('blocks when params.id is NaN', () => {
    const next = jest.fn();
    const req = { params: { id: 'abc' }, user: { id: '1' } };
    ensureSelfParam('id')(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(403);
  });

  test('blocks when user is missing', () => {
    const next = jest.fn();
    const req = { params: { id: '1' }, user: null };
    ensureSelfParam('id')(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(403);
  });
});
