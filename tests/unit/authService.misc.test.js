// ---- Mocks ----
// Mock TokenService
jest.mock('../../src/shared/utils/token.js', () => {
  return {
    TokenService: jest.fn().mockImplementation(() => ({
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'new.access',
        refreshToken: 'new.refresh',
      }),
      verifyRefreshToken: jest
        .fn()
        .mockReturnValue({ userId: '1', email: 'a@a.com', role: 'user' }),
    })),
  };
});

import { jest } from '@jest/globals';

import { AuthService } from '../../src/application/services/AuthService.js';
import { API_ERROR_CODES } from '../../src/shared/constants/apiCodes.js';
import { makeUser, makeVerificationToken } from '../factories/userFactory.js';

const makeRepo = () => ({
  findByVerificationToken: jest.fn(),
  setVerified: jest.fn(),
  findById: jest.fn(),
});

const makeSessionRepo = () => ({
  findByToken: jest.fn(),
  deleteById: jest.fn(),
  deleteByToken: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService.refreshToken', () => {
  it('should throw if session token not found', async () => {
    const sessionRepo = makeSessionRepo();
    sessionRepo.findByToken.mockResolvedValue(null);
    const repo = makeRepo();
    const service = new AuthService(repo, sessionRepo);

    await expect(service.refreshToken('invalid')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
    });
  });
});

describe('AuthService.verifyEmail', () => {
  it('should throw on invalid token format', async () => {
    const repo = makeRepo();
    const sessionRepo = makeSessionRepo();
    const service = new AuthService(repo, sessionRepo);
    await expect(service.verifyEmail('not-a-uuid')).rejects.toMatchObject({
      code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
    });
  });

  it('should mark user verified', async () => {
    const token = makeVerificationToken();
    const user = makeUser({
      verificationToken: token,
      verificationExpiresAt: new Date(Date.now() + 60000),
      isVerified: false,
    });
    const repo = makeRepo();
    const sessionRepo = makeSessionRepo();
    repo.findByVerificationToken.mockResolvedValue(user);

    const service = new AuthService(repo, sessionRepo);
    await service.verifyEmail(token);
    expect(repo.setVerified).toHaveBeenCalledWith(user.id, true);
  });
});

describe('AuthService.logout', () => {
  it('should throw on unknown token', async () => {
    const sessionRepo = makeSessionRepo();
    sessionRepo.deleteByToken.mockResolvedValue(0);
    const repo = makeRepo();
    const service = new AuthService(repo, sessionRepo);
    await expect(service.logout('invalid')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
    });
  });

  it('should return true on successful delete', async () => {
    const sessionRepo = makeSessionRepo();
    sessionRepo.deleteByToken.mockResolvedValue(1);
    const repo = makeRepo();
    const service = new AuthService(repo, sessionRepo);
    const result = await service.logout('valid');
    expect(result).toBe(true);
  });
});
