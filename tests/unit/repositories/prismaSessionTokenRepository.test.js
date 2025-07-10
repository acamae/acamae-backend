import { PrismaSessionTokenRepository } from '../../../src/infrastructure/repositories/PrismaSessionTokenRepository.js';

const mockPrisma = {
  sessionToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

// Mock @prisma/client to prevent real database connections
jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PrismaSessionTokenRepository', () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PrismaSessionTokenRepository();
  });

  const dbToken = {
    id: 1,
    user_id: 2,
    token: 'refresh',
    last_activity_at: new Date('2020-01-01T00:00:00Z'),
    expires_at: new Date('2020-01-08T00:00:00Z'),
    created_at: new Date('2020-01-01T00:00:00Z'),
  };

  it('create returns domain object', async () => {
    mockPrisma.sessionToken.create.mockResolvedValue(dbToken);
    const domain = await repo.create({
      userId: '2',
      token: 'refresh',
      lastActivityAt: dbToken.last_activity_at,
      expiresAt: dbToken.expires_at,
    });
    expect(domain).toMatchObject({ id: '1', userId: '2', token: 'refresh' });
  });

  it('findByToken returns domain object or null', async () => {
    mockPrisma.sessionToken.findUnique.mockResolvedValueOnce(dbToken);
    const res = await repo.findByToken('refresh');
    expect(res.id).toBe('1');
    mockPrisma.sessionToken.findUnique.mockResolvedValueOnce(null);
    const none = await repo.findByToken('none');
    expect(none).toBeNull();
  });

  it('deleteByToken returns number of deleted records', async () => {
    mockPrisma.sessionToken.deleteMany.mockResolvedValue({ count: 1 });
    const count = await repo.deleteByToken('refresh');
    expect(count).toBe(1);
  });

  it('update delegates to prisma and maps result', async () => {
    const updated = { ...dbToken, token: 'new' };
    mockPrisma.sessionToken.update.mockResolvedValue(updated);
    const res = await repo.update('1', {
      token: 'new',
      lastActivityAt: updated.last_activity_at,
      expiresAt: updated.expires_at,
    });
    expect(mockPrisma.sessionToken.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        token: 'new',
        last_activity_at: updated.last_activity_at,
        expires_at: updated.expires_at,
      },
    });
    expect(res.token).toBe('new');
  });
});
