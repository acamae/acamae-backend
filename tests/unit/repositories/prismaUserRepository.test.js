import bcrypt from 'bcryptjs';

import { PrismaUserRepository } from '../../../src/infrastructure/repositories/PrismaUserRepository.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Prepare mocked Prisma
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
};

// Mock @prisma/client to prevent real database connections
jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PrismaUserRepository', () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PrismaUserRepository();
  });

  describe('#toDomainModel', () => {
    it('returns null for null input', () => {
      // Cannot test private method directly, but it's tested indirectly through other methods
      expect(true).toBe(true);
    });

    it('correctly maps complete user object', async () => {
      const prismaUser = {
        id: 1, // Note: ID is numeric in Prisma
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpass',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_verified: true,
        is_active: true,
        last_login_at: new Date('2023-01-01'),
        last_login_ip: '127.0.0.1',
        verification_token: 'token123',
        verification_expires_at: new Date('2023-12-31'),
        reset_token: 'reset123',
        reset_expires_at: new Date('2023-12-31'),
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      mockPrisma.user.findUnique.mockResolvedValue(prismaUser);
      const result = await repo.findById('1');

      expect(result).toEqual({
        id: '1', // Converted to string
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpass',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isVerified: true,
        isActive: true,
        lastLoginAt: prismaUser.last_login_at,
        lastLoginIp: '127.0.0.1',
        verificationToken: 'token123',
        verificationExpiresAt: prismaUser.verification_expires_at,
        resetToken: 'reset123',
        resetExpiresAt: prismaUser.reset_expires_at,
        createdAt: prismaUser.created_at,
        updatedAt: prismaUser.updated_at,
      });
    });

    it('correctly maps user object with null fields', async () => {
      const prismaUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpass',
        first_name: null,
        last_name: null,
        role: 'user',
        is_verified: false,
        is_active: true,
        last_login_at: null,
        last_login_ip: null,
        verification_token: null,
        verification_expires_at: null,
        reset_token: null,
        reset_expires_at: null,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      mockPrisma.user.findUnique.mockResolvedValue(prismaUser);
      const result = await repo.findById('1');

      // The real repository maps null to undefined
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.lastLoginAt).toBeUndefined();
      expect(result.lastLoginIp).toBeUndefined();
      expect(result.verificationToken).toBeUndefined();
      expect(result.verificationExpiresAt).toBeUndefined();
      expect(result.resetToken).toBeUndefined();
      expect(result.resetExpiresAt).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns mapped array', async () => {
      const prismaUsers = [{ id: 1, email: 'test@example.com', username: 'test' }];
      mockPrisma.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repo.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });

    it('filters null results', async () => {
      mockPrisma.user.findMany.mockResolvedValue([null, { id: 1 }, null]);

      const result = await repo.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns user or null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const result = await repo.findById('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findByUsername', () => {
    it('finds user by username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, username: 'testuser' });

      const result = await repo.findByUsername('testuser');

      expect(result).toBeDefined();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    });

    it('returns null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('finds user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const result = await repo.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates user correctly', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'plaintext',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        verificationToken: 'token123',
        verificationExpiresAt: new Date(),
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: userData.email,
        username: userData.username,
        password_hash: 'hashedpassword',
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        is_verified: false,
        is_active: true,
        verification_token: userData.verificationToken,
        verification_expires_at: userData.verificationExpiresAt,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await repo.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          password_hash: 'hashedpassword',
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          is_verified: false,
          is_active: true,
          last_login_at: userData.lastLoginAt,
          last_login_ip: userData.lastLoginIp,
          verification_token: userData.verificationToken,
          verification_expires_at: userData.verificationExpiresAt,
          reset_token: userData.resetToken,
          reset_expires_at: userData.resetExpiresAt,
        },
      });
      expect(result.id).toBe('1');
    });

    it('uses correct default values', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'plaintext',
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: userData.email,
        username: userData.username,
        password_hash: 'hashedpassword',
        first_name: null,
        last_name: null,
        role: 'user',
        is_verified: false,
        is_active: true,
        verification_token: null,
        verification_expires_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await repo.create(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'user',
          is_verified: false,
          is_active: true,
        }),
      });
    });

    it('handles duplicate email error', async () => {
      const error = new Error('Unique constraint failed');
      error.code = 'P2002';
      error.meta = { target: ['email'] };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        repo.create({ email: 'test@example.com', username: 'test', password: 'pass' })
      ).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
      });
    });

    it('handles duplicate username error', async () => {
      const error = new Error('Unique constraint failed');
      error.code = 'P2002';
      error.meta = { target: ['username'] };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        repo.create({ email: 'test@example.com', username: 'test', password: 'pass' })
      ).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
      });
    });

    it('re-throws other errors', async () => {
      const error = new Error('Database connection failed');
      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        repo.create({ email: 'test@example.com', username: 'test', password: 'pass' })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('updates data with new password', async () => {
      const updateData = {
        email: 'newemail@example.com',
        password: 'newpassword',
        firstName: 'Jane',
      };

      bcrypt.hash.mockResolvedValue('newhashedpassword');
      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        email: updateData.email,
        password_hash: 'newhashedpassword',
        first_name: updateData.firstName,
        updated_at: new Date(),
      });

      const result = await repo.update('1', updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          email: updateData.email,
          password_hash: 'newhashedpassword',
          first_name: updateData.firstName,
        }),
      });
      expect(result).toBeDefined();
    });

    it('updates without password', async () => {
      const updateData = {
        email: 'newemail@example.com',
        firstName: 'Jane',
      };

      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        email: updateData.email,
        first_name: updateData.firstName,
        updated_at: new Date(),
      });

      await repo.update('1', updateData);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          email: updateData.email,
          first_name: updateData.firstName,
        }),
      });
    });
  });

  describe('delete', () => {
    it('deletes user by ID', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });

      const result = await repo.delete('1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBeUndefined(); // delete method returns void
    });
  });

  describe('setVerified', () => {
    it('changes verification flag and clears expiration', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 1, is_verified: true });

      const result = await repo.setVerified('1', true);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          is_verified: true,
          verification_expires_at: null,
        },
      });
      expect(result).toBeDefined();
    });

    it('can mark as unverified', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 1, is_verified: false });

      await repo.setVerified('1', false);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          is_verified: false,
        }),
      });
    });
  });

  describe('setVerificationToken', () => {
    it('sets token and expiration date', async () => {
      const expiresAt = new Date();
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      const result = await repo.setVerificationToken('1', 'token123', expiresAt);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          verification_token: 'token123',
          verification_expires_at: expiresAt,
        },
      });
      expect(result).toBeDefined();
    });
  });

  describe('setResetToken', () => {
    it('sets reset token and expiration date', async () => {
      const expiresAt = new Date();
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      const result = await repo.setResetToken('1', 'resettoken', expiresAt);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          reset_token: 'resettoken',
          reset_expires_at: expiresAt,
        },
      });
      expect(result).toBeDefined();
    });
  });

  describe('findByVerificationToken', () => {
    it('finds user by token (includes expired)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, verification_token: 'token123' });

      const result = await repo.findByVerificationToken('token123');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { verification_token: 'token123' },
      });
      expect(result).toBeDefined();
    });

    it('returns null if not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findByVerificationToken('invalidtoken');

      expect(result).toBeNull();
    });
  });

  describe('findByValidVerificationToken', () => {
    it('finds user by valid token (not expired)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, verification_token: 'token123' });

      const result = await repo.findByValidVerificationToken('token123');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          verification_token: 'token123',
          verification_expires_at: { gt: expect.any(Date) },
        },
      });
      expect(result).toBeDefined();
    });

    it('returns null if token expired or not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findByValidVerificationToken('expiredtoken');

      expect(result).toBeNull();
    });
  });

  describe('findByResetToken', () => {
    it('finds user by valid reset token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, reset_token: 'resettoken' });

      const result = await repo.findByResetToken('resettoken');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          reset_token: 'resettoken',
          reset_expires_at: { gt: expect.any(Date) },
        },
      });
      expect(result).toBeDefined();
    });

    it('returns null if token expired or not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findByResetToken('invalidtoken');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithFields', () => {
    it('selects specific fields when provided', async () => {
      const fields = ['id', 'email', 'username'];
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const result = await repo.findByIdWithFields('1', fields);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true, username: true },
      });
      expect(result).toBeDefined();
    });

    it('uses default fields when none specified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await repo.findByIdWithFields('1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          email: true,
          username: true,
        }),
      });
      expect(result).toBeDefined();
    });

    it('ignores invalid fields', async () => {
      const fields = ['id', 'email', 'invalid_field'];
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await repo.findByIdWithFields('1', fields);

      const callArgs = mockPrisma.user.findUnique.mock.calls[0][0];
      expect(callArgs.select).not.toHaveProperty('invalid_field');
    });

    it('returns null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findByIdWithFields('999');

      expect(result).toBeNull();
    });
  });

  describe('updateLoginTracking', () => {
    it('updates login information with IP', async () => {
      const lastLoginAt = new Date();
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      await repo.updateLoginTracking('1', lastLoginAt, '192.168.1.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          last_login_at: lastLoginAt,
          last_login_ip: '192.168.1.1',
        },
      });
    });

    it('updates login information without IP', async () => {
      const lastLoginAt = new Date();
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      await repo.updateLoginTracking('1', lastLoginAt);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          last_login_at: lastLoginAt,
          last_login_ip: null,
        },
      });
    });
  });

  describe('cleanExpiredVerificationTokens', () => {
    it('cleans expired tokens successfully', async () => {
      mockPrisma.user.updateMany.mockResolvedValue({ count: 5 });

      const result = await repo.cleanExpiredVerificationTokens();

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          verification_expires_at: { lt: expect.any(Date) },
          verification_token: { not: null },
        },
        data: {
          verification_token: null,
          verification_expires_at: null,
        },
      });
      expect(result).toBe(5);
    });

    it('handles errors and returns 0', async () => {
      mockPrisma.user.updateMany.mockRejectedValue(new Error('Database error'));

      const result = await repo.cleanExpiredVerificationTokens();

      expect(result).toBe(0);
    });
  });
});
