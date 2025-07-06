import { UserController } from '../../../src/infrastructure/controllers/UserController.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';

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
    expect(res.apiSuccess).toHaveBeenCalledWith(result.users, 'Usuarios obtenidos exitosamente', {
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
      expect(res.apiSuccess).toHaveBeenCalledWith(user, 'Usuario obtenido exitosamente');
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with NOT_FOUND when user missing', async () => {
      service.getUserById.mockResolvedValue(null);
      const req = { params: { id: '3' } };

      await controller.getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
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
      expect(res.apiSuccess).toHaveBeenCalledWith(updated, 'Usuario actualizado exitosamente');
    });

    it('calls next with NOT_FOUND when user missing', async () => {
      service.updateUser.mockResolvedValue(null);
      const req = { params: { id: '5' }, body: {} };
      await controller.updateUser(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });

  describe('deleteUser', () => {
    it('returns 200 when deleted', async () => {
      service.deleteUser.mockResolvedValue(true);
      const req = { params: { id: '6' } };
      await controller.deleteUser(req, res, next);
      expect(service.deleteUser).toHaveBeenCalledWith('6');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Usuario eliminado exitosamente');
    });

    it('calls next with NOT_FOUND when user missing', async () => {
      service.deleteUser.mockResolvedValue(false);
      const req = { params: { id: '7' } };
      await controller.deleteUser(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });
});
