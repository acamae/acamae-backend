import jwt from 'jsonwebtoken';

import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { TokenService } from '../../../src/shared/utils/token.js';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('TokenService', () => {
  const payload = { sub: '123' };
  const secrets = {
    access: 'access-secret',
    refresh: 'refresh-secret',
  };

  let service;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenService(secrets.access, secrets.refresh, '1h', '7d');
  });

  it('generates tokens with jwt.sign', () => {
    jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    const tokens = service.generateTokens(payload);

    expect(jwt.sign).toHaveBeenCalledTimes(2);
    expect(tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('verifyAccessToken returns decoded payload', () => {
    jwt.verify.mockReturnValue(payload);
    const result = service.verifyAccessToken('access-token');
    expect(jwt.verify).toHaveBeenCalledWith('access-token', secrets.access);
    expect(result).toBe(payload);
  });

  it('verifyRefreshToken returns decoded payload', () => {
    jwt.verify.mockReturnValue(payload);
    const result = service.verifyRefreshToken('refresh-token');
    expect(jwt.verify).toHaveBeenCalledWith('refresh-token', secrets.refresh);
    expect(result).toBe(payload);
  });

  it('throws error with proper code when jwt.verify fails', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    try {
      service.verifyAccessToken('bad');
    } catch (err) {
      expect(err.code).toBe(API_ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  });
});
