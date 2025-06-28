import { jest } from '@jest/globals';

import { AuthService } from '../../src/application/services/AuthService.js';
import { API_ERROR_CODES } from '../../src/shared/constants/apiCodes.js';
import { makeUser } from '../factories/userFactory.js';

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

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

const mockRepo = () => ({
  findByEmail: jest.fn(),
});

describe('AuthService.login', () => {
  it('returns tokens when credentials are valid', async () => {
    const user = makeUser({ passwordHash: 'hashed' });
    const repo = mockRepo();
    repo.findByEmail.mockResolvedValue(user);

    const sessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteById: jest.fn(),
      deleteByToken: jest.fn(),
      update: jest.fn(),
    };
    const service = new AuthService(repo, sessionRepo);
    const result = await service.login(user.email, 'Password123!');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws when user not found', async () => {
    const repo = mockRepo();
    repo.findByEmail.mockResolvedValue(null);

    const sessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteById: jest.fn(),
      deleteByToken: jest.fn(),
      update: jest.fn(),
    };
    const service = new AuthService(repo, sessionRepo);
    await expect(service.login('no@no.com', 'xx')).rejects.toMatchObject({
      code: API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    });
  });
});
