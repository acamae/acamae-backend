import bcrypt from 'bcryptjs';

import { PrismaUserRepository } from '../../../src/infrastructure/repositories/PrismaUserRepository.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';

// Mock bcrypt
jest.mock('bcryptjs', () => ({ hash: jest.fn(() => Promise.resolve('hashed')) }));

// Prepare mocked Prisma
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PrismaUserRepository', () => {
  let repo;
  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PrismaUserRepository();
  });

  const dbUser = {
    id: 1,
    username: 'test',
    email: 'a@b.com',
    password_hash: 'hashed',
    first_name: null,
    last_name: null,
    role: 'user',
    is_verified: true,
    verification_token: null,
    verification_expires_at: null,
    reset_token: null,
    reset_expires_at: null,
    created_at: new Date('2020-01-01T00:00:00Z'),
    updated_at: new Date('2020-01-02T00:00:00Z'),
  };

  it('findAll devuelve array mapeado', async () => {
    mockPrisma.user.findMany.mockResolvedValue([dbUser]);
    const users = await repo.findAll();
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ id: '1', username: 'test', email: 'a@b.com' });
  });

  it('findById devuelve usuario o null', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(dbUser);
    const user = await repo.findById('1');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(user).toMatchObject({ id: '1' });

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const none = await repo.findById('2');
    expect(none).toBeNull();
  });

  it('create mapea y maneja duplicados', async () => {
    mockPrisma.user.create.mockResolvedValueOnce(dbUser);
    const created = await repo.create({
      username: 'test',
      email: 'a@b.com',
      password: '123',
    });
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(created).toMatchObject({ id: '1', email: 'a@b.com' });

    // Simular prisma error P2002 (duplicate email)
    const dupErr = new Error('duplicate');
    dupErr.code = 'P2002';
    dupErr.meta = { target: ['email'] };
    mockPrisma.user.create.mockRejectedValueOnce(dupErr);

    await expect(
      repo.create({ username: 't', email: 'dup@b.com', password: '123' })
    ).rejects.toHaveProperty('code', API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS);
  });

  it('update actualiza datos y password', async () => {
    // Implementation needed
  });

  it('update sin password no llama hash', async () => {
    bcrypt.hash.mockClear();
    mockPrisma.user.update.mockResolvedValue({ ...dbUser, first_name: 'F' });
    const upd = await repo.update('1', { firstName: 'F' });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(upd.firstName).toBe('F');
  });

  it('setVerified cambia flag', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...dbUser, is_verified: false });
    const res = await repo.setVerified('1', false);
    expect(res.isVerified).toBe(false);
  });

  it('findByVerificationToken devuelve null si expirado', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce(null);
    const res = await repo.findByVerificationToken('bad');
    expect(res).toBeNull();
  });
});
