// Mock TokenService
jest.mock('../../src/shared/utils/token.js', () => {
  return {
    TokenService: jest.fn().mockImplementation(() => ({
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      }),
      verifyRefreshToken: jest
        .fn()
        .mockReturnValue({ userId: '1', email: 'a@a.com', role: 'user' }),
    })),
  };
});

import { AuthService } from '../../src/application/services/AuthService.js';
import { API_ERROR_CODES } from '../../src/shared/constants/apiCodes.js';
import { makeUser } from '../factories/userFactory.js';

const mockUserRepo = () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  findByVerificationToken: jest.fn(),
  findByValidVerificationToken: jest.fn(),
  setVerified: jest.fn(),
  findById: jest.fn(),
  findByResetToken: jest.fn(),
  setResetToken: jest.fn(),
  setVerificationToken: jest.fn(),
  update: jest.fn(),
  updateLoginTracking: jest.fn(),
  cleanExpiredVerificationTokens: jest.fn(),
});

const mockSessionRepo = () => ({
  create: jest.fn(),
  findByToken: jest.fn(),
  deleteById: jest.fn(),
  deleteByToken: jest.fn(),
  update: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService.refreshToken', () => {
  it('should throw if session token not found', async () => {
    const userRepo = mockUserRepo();
    const sessionRepo = mockSessionRepo();
    sessionRepo.findByToken.mockResolvedValue(null);
    const service = new AuthService(userRepo, sessionRepo);

    await expect(service.refreshToken('invalid')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
    });
  });
});

describe('AuthService.verifyEmail', () => {
  it('should throw on invalid token format', async () => {
    const userRepo = mockUserRepo();
    const sessionRepo = mockSessionRepo();
    const service = new AuthService(userRepo, sessionRepo);

    await expect(service.verifyEmail('invalid-format')).rejects.toMatchObject({
      code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
    });
  });

  it('should mark user verified', async () => {
    const userRepo = mockUserRepo();
    const sessionRepo = mockSessionRepo();
    const service = new AuthService(userRepo, sessionRepo);

    const validToken = '12345678-1234-4abc-8def-123456789012';
    const user = makeUser({
      verificationToken: validToken,
      verificationExpiresAt: new Date(Date.now() + 60000),
      isVerified: false,
    });

    userRepo.findByVerificationToken.mockResolvedValue(user);
    userRepo.setVerified.mockResolvedValue(user);

    const result = await service.verifyEmail(validToken);

    expect(result.status).toBe('SUCCESS');
    expect(userRepo.setVerified).toHaveBeenCalledWith(user.id, true);
  });
});

describe('AuthService.logout', () => {
  it('should throw on unknown token', async () => {
    const userRepo = mockUserRepo();
    const sessionRepo = mockSessionRepo();
    sessionRepo.deleteByToken.mockResolvedValue(0);
    const service = new AuthService(userRepo, sessionRepo);

    await expect(service.logout('unknown')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
    });
  });

  it('should return true on successful delete', async () => {
    const userRepo = mockUserRepo();
    const sessionRepo = mockSessionRepo();
    sessionRepo.deleteByToken.mockResolvedValue(1);
    const service = new AuthService(userRepo, sessionRepo);

    const result = await service.logout('valid-token');
    expect(result).toBe(true);
  });
});
