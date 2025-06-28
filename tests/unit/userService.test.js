import { jest } from '@jest/globals';

import { UserService } from '../../src/application/services/UserService.js';
import { API_ERROR_CODES } from '../../src/shared/constants/apiCodes.js';
import { makeUser } from '../factories/userFactory.js';

// Helper to build a mocked UserRepository
const makeRepo = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const stripPassword = (u) => {
  const { passwordHash, ...rest } = u;
  return rest;
};

describe('UserService', () => {
  describe('getAllUsers', () => {
    it('should return users without passwordHash', async () => {
      const repo = makeRepo();
      const users = [makeUser({ passwordHash: 'hashed' }), makeUser({ passwordHash: 'hashed2' })];
      repo.findAll.mockResolvedValue(users);

      const service = new UserService(repo);
      const result = await service.getAllUsers();

      expect(result).toEqual(users.map(stripPassword));
    });
  });

  describe('getUserById', () => {
    it('should throw if user not found', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const service = new UserService(repo);

      await expect(service.getUserById('123')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    });

    it('should return user without passwordHash', async () => {
      const user = makeUser({ passwordHash: 'hashed' });
      const repo = makeRepo();
      repo.findById.mockResolvedValue(user);
      const service = new UserService(repo);
      const result = await service.getUserById(user.id);
      expect(result).toEqual(stripPassword(user));
    });
  });

  describe('updateUser', () => {
    it('should prevent duplicate email', async () => {
      const repo = makeRepo();
      const existing = makeUser({ id: '1' });
      repo.findByEmail.mockResolvedValue(existing);
      const service = new UserService(repo);

      await expect(service.updateUser('2', { email: existing.email })).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
      });
    });

    it('should prevent duplicate username', async () => {
      const repo = makeRepo();
      const existing = makeUser({ id: '1' });
      repo.findByUsername.mockResolvedValue(existing);
      const service = new UserService(repo);

      await expect(service.updateUser('2', { username: existing.username })).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
      });
    });

    it('should update and return cleaned user', async () => {
      const repo = makeRepo();
      const updated = makeUser({ id: '1', passwordHash: 'hash' });
      repo.findByEmail.mockResolvedValue(null);
      repo.findByUsername.mockResolvedValue(null);
      repo.update.mockResolvedValue(updated);
      const service = new UserService(repo);
      const result = await service.updateUser('1', { email: updated.email });
      expect(result).toEqual(stripPassword(updated));
    });
  });

  describe('deleteUser', () => {
    it('should throw if user does not exist', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const service = new UserService(repo);
      await expect(service.deleteUser('999')).rejects.toMatchObject({
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    });

    it('should delete user and return true', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeUser());
      repo.delete.mockResolvedValue();
      const service = new UserService(repo);
      const result = await service.deleteUser('1');
      expect(repo.delete).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });
  });
});
