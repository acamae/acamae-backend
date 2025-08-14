import { UserController } from '../../../src/infrastructure/controllers/UserController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

describe('UserController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      addGame: jest.fn(),
      removeGame: jest.fn(),
      getPublicProfile: jest.fn(),
    };
    controller = new UserController(service);
    res = makeRes();
    next = jest.fn();
  });

  it('getAllUsers -> 200', async () => {
    const result = {
      users: [{ id: '1' }],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
    service.getAllUsers.mockResolvedValue(result);

    const req = { query: {} };
    await controller.getAllUsers(req, res, next);

    expect(service.getAllUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(result.users, 'Users retrieved successfully', {
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  describe('getUserById', () => {
    it('returns 200 when found', async () => {
      const user = { id: '2' };
      service.getUserById.mockResolvedValue(user);

      const req = { params: { id: '2' } };
      await controller.getUserById(req, res, next);

      expect(service.getUserById).toHaveBeenCalledWith('2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(user, 'User retrieved successfully');
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with NOT_FOUND when user missing', async () => {
      const error = new Error('User not found');
      service.getUserById.mockRejectedValue(error);
      const req = { params: { id: '3' } };

      await controller.getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('returns 200 when updated', async () => {
      const updated = { id: '4', name: 'n' };
      service.updateUser.mockResolvedValue(updated);

      const req = { params: { id: '4' }, body: { name: 'n' } };
      await controller.updateUser(req, res, next);

      expect(service.updateUser).toHaveBeenCalledWith('4', { name: 'n' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(updated, 'User updated successfully');
    });

    it('calls next with NOT_FOUND when user missing', async () => {
      const error = new Error('User not found');
      service.updateUser.mockRejectedValue(error);
      const req = { params: { id: '5' }, body: {} };
      await controller.updateUser(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('returns 200 when deleted', async () => {
      service.deleteUser.mockResolvedValue(true);
      const req = { params: { id: '6' } };
      await controller.deleteUser(req, res, next);
      expect(service.deleteUser).toHaveBeenCalledWith('6');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'User deleted successfully');
    });

    it('calls next with NOT_FOUND when user missing', async () => {
      const error = new Error('User not found');
      service.deleteUser.mockRejectedValue(error);
      const req = { params: { id: '7' } };
      await controller.deleteUser(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('addGame/removeGame', () => {
    it('addGame -> 200 y payload esperado', async () => {
      const payload = { gameId: 17, selected: true, profileIsActive: false };
      service.addGame.mockResolvedValue(payload);
      const req = { params: { id: '9' }, body: { gameId: 17 } };
      await controller.addGame(req, res, next);
      expect(service.addGame).toHaveBeenCalledWith('9', 17);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Games updated');
    });

    it('removeGame -> 200 y payload esperado', async () => {
      const payload = { gameId: 17, selected: false, profileIsActive: true };
      service.removeGame.mockResolvedValue(payload);
      const req = { params: { id: '9' }, body: { gameId: 17 } };
      await controller.removeGame(req, res, next);
      expect(service.removeGame).toHaveBeenCalledWith('9', 17);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Games updated');
    });
  });

  it('getPublicProfile -> 200 devuelve perfil público sin usar includeAvailability', async () => {
    const payload = { user: { id: '9' }, games: [], timezone: 'Europe/Madrid', availability: [] };
    service.getPublicProfile.mockResolvedValue(payload);

    const req = { params: { id: '9' }, query: { includeAvailability: 'true' } };
    await controller.getPublicProfile(req, res, next);

    expect(service.getPublicProfile).toHaveBeenCalledWith('9');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Public profile retrieved');
    expect(next).not.toHaveBeenCalled();
  });
});
