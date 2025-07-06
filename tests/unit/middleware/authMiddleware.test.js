import {
  authenticate,
  authorize,
  isAdmin,
  isManagerOrAdmin,
} from '../../../src/infrastructure/middleware/auth.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

// ---------- Mocks ----------

// Mock TokenService verifyAccessToken behaviour
jest.mock('../../../src/shared/utils/token.js', () => {
  class TokenService {
    verifyAccessToken(token) {
      if (token === 'validAccess') {
        return { userId: 'user-1' };
      }
      const err = new Error('Invalid token');
      err.code = 'AUTH_TOKEN_INVALID';
      throw err;
    }
  }
  return { TokenService };
});

// Mock PrismaUserRepository
jest.mock('../../../src/infrastructure/repositories/PrismaUserRepository.js', () => {
  const mockRepository = {
    findByIdWithFields: jest.fn(),
  };

  return {
    PrismaUserRepository: jest.fn(() => mockRepository),
    __mockRepository: mockRepository,
  };
});

// Helper para acceder al repository mock
const getMockRepository = () =>
  require('../../../src/infrastructure/repositories/PrismaUserRepository.js').__mockRepository;

// Helpers para construir req/res/next
const buildReq = (overrides = {}) => ({
  headers: {},
  params: {},
  ...overrides,
});

const noopRes = {};

const buildNext = () => jest.fn();

describe('authenticate middleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns UNAUTHORIZED when header missing', async () => {
    const req = buildReq();
    const next = buildNext();
    await authenticate(req, noopRes, next);

    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.UNAUTHORIZED);
    expect(err.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('returns AUTH_TOKEN_INVALID when header malformed', async () => {
    const req = buildReq({ headers: { authorization: 'badHeader' } });
    const next = buildNext();
    await authenticate(req, noopRes, next);
    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.AUTH_TOKEN_INVALID);
  });

  it('returns AUTH_TOKEN_INVALID on token verification failure', async () => {
    const req = buildReq({ headers: { authorization: 'Bearer invalidToken' } });
    const next = buildNext();
    await authenticate(req, noopRes, next);
    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.AUTH_TOKEN_INVALID);
  });

  it('returns AUTH_USER_NOT_FOUND when user not exists', async () => {
    getMockRepository().findByIdWithFields.mockResolvedValue(null);

    const req = buildReq({ headers: { authorization: 'Bearer validAccess' } });
    const next = buildNext();
    await authenticate(req, noopRes, next);

    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.AUTH_USER_NOT_FOUND);
  });

  it('returns UNAUTHORIZED when user not verified', async () => {
    getMockRepository().findByIdWithFields.mockResolvedValue({
      id: 'user-1',
      isVerified: false,
    });

    const req = buildReq({ headers: { authorization: 'Bearer validAccess' } });
    const next = buildNext();
    await authenticate(req, noopRes, next);

    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.UNAUTHORIZED);
  });

  it('attaches user and calls next() on success', async () => {
    getMockRepository().findByIdWithFields.mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      isVerified: true,
    });

    const req = buildReq({ headers: { authorization: 'Bearer validAccess' } });
    const next = buildNext();
    await authenticate(req, noopRes, next);

    expect(req.user).toEqual(expect.objectContaining({ id: 'user-1' }));
    expect(next).toHaveBeenCalledWith();
  });
});

describe('authorize helpers', () => {
  const baseReq = { user: { role: 'user' } };
  const next = buildNext();

  it('authorize denies roles not in list', () => {
    const req = { ...baseReq };
    const middleware = authorize(['admin']);
    middleware(req, noopRes, next);

    const err = next.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.AUTH_FORBIDDEN);
  });

  it('authorize passes allowed role', () => {
    const req = { user: { role: 'admin' } };
    const passNext = buildNext();
    const middleware = authorize(['admin']);
    middleware(req, noopRes, passNext);
    expect(passNext).toHaveBeenCalledWith();
  });

  it('isAdmin wrapper only allows admin', () => {
    const adminReq = { user: { role: 'admin' } };
    const userReq = { user: { role: 'user' } };

    const adminNext = buildNext();
    isAdmin()(adminReq, noopRes, adminNext);
    expect(adminNext).toHaveBeenCalledWith();

    const denyNext = buildNext();
    isAdmin()(userReq, noopRes, denyNext);
    const err = denyNext.mock.calls[0][0];
    expect(err.code).toBe(API_ERROR_CODES.AUTH_FORBIDDEN);
  });

  it('isManagerOrAdmin allows manager', () => {
    const req = { user: { role: 'manager' } };
    const passNext = buildNext();
    isManagerOrAdmin()(req, noopRes, passNext);
    expect(passNext).toHaveBeenCalled();
  });
});
