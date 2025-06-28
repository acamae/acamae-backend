import { jest } from '@jest/globals';

import { AuthService } from '../../src/application/services/AuthService.js';
import { API_ERROR_CODES } from '../../src/shared/constants/apiCodes.js';
import { TokenService } from '../../src/shared/utils/token.js';
import { makeRegisterDto, makeUser } from '../factories/userFactory.js';

// Mock TokenService generate/verify to deterministic values
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

const mockUserRepo = () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  findByVerificationToken: jest.fn(),
  setVerified: jest.fn(),
  findById: jest.fn(),
  findByResetToken: jest.fn(),
  setResetToken: jest.fn(),
  update: jest.fn(),
});

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('AuthService.register', () => {
  it('should create user and send verification email', async () => {
    const repo = mockUserRepo();
    repo.findByEmail.mockResolvedValue(null);
    repo.findByUsername.mockResolvedValue(null);
    const newUser = makeUser({ isVerified: false });
    repo.create.mockResolvedValue(newUser);

    const sessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteById: jest.fn(),
      deleteByToken: jest.fn(),
      update: jest.fn(),
    };
    const service = new AuthService(repo, sessionRepo);

    const dto = makeRegisterDto({
      email: newUser.email,
      username: newUser.username,
      password: 'Secret123!',
    });

    const result = await service.register(dto);

    expect(repo.create).toHaveBeenCalled();
    expect(result.email).toBe(newUser.email);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should throw if email already exists', async () => {
    const repo = mockUserRepo();
    repo.findByEmail.mockResolvedValue(makeUser());
    repo.findByUsername.mockResolvedValue(null);

    const sessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteById: jest.fn(),
      deleteByToken: jest.fn(),
      update: jest.fn(),
    };
    const service = new AuthService(repo, sessionRepo);
    await expect(service.register(makeRegisterDto())).rejects.toMatchObject({
      code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
    });
  });
});

describe('AuthService.register duplicate username', () => {
  it('should throw if username already exists', async () => {
    const repo = mockUserRepo();
    repo.findByEmail.mockResolvedValue(null);
    repo.findByUsername.mockResolvedValue(makeUser());

    const sessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteById: jest.fn(),
      deleteByToken: jest.fn(),
      update: jest.fn(),
    };
    const service = new AuthService(repo, sessionRepo);
    await expect(service.register(makeRegisterDto())).rejects.toMatchObject({
      code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
    });
  });
});

// Silence real email sending
jest.spyOn(AuthService.prototype, 'sendVerificationEmail').mockResolvedValue();
