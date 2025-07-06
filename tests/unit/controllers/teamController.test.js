import { TeamController } from '../../../src/infrastructure/controllers/TeamController.js';
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

describe('TeamController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = {
      getAllTeams: jest.fn(),
      getTeamById: jest.fn(),
      createTeam: jest.fn(),
      updateTeam: jest.fn(),
      deleteTeam: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
    };
    controller = new TeamController(service);
    res = makeRes();
    next = jest.fn();
  });

  it('getAllTeams -> 200', async () => {
    const teams = [{ id: '1' }];
    service.getAllTeams.mockResolvedValue(teams);
    await controller.getAllTeams({}, res, next);
    expect(service.getAllTeams).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(teams, 'Equipos obtenidos exitosamente');
  });

  describe('getTeamById', () => {
    it('found -> 200', async () => {
      const team = { id: '2' };
      service.getTeamById.mockResolvedValue(team);
      await controller.getTeamById({ params: { id: '2' } }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(team, 'Equipo obtenido exitosamente');
    });

    it('not found -> next(err)', async () => {
      service.getTeamById.mockResolvedValue(null);
      await controller.getTeamById({ params: { id: 'x' } }, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });

  it('createTeam -> 201', async () => {
    const newTeam = { id: '3' };
    service.createTeam.mockResolvedValue(newTeam);
    await controller.createTeam({ body: { name: 'N' } }, res, next);
    expect(service.createTeam).toHaveBeenCalledWith({ name: 'N' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.apiSuccess).toHaveBeenCalledWith(newTeam, 'Equipo creado exitosamente');
  });

  describe('updateTeam', () => {
    it('updated -> 200', async () => {
      const updatedTeam = { id: '4' };
      service.updateTeam.mockResolvedValue(updatedTeam);
      await controller.updateTeam({ params: { id: '4' }, body: {} }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(updatedTeam, 'Equipo actualizado exitosamente');
    });

    it('not found -> next(err)', async () => {
      service.updateTeam.mockResolvedValue(null);
      await controller.updateTeam({ params: { id: 'nf' }, body: {} }, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });

  describe('deleteTeam', () => {
    it('deleted -> 200', async () => {
      service.deleteTeam.mockResolvedValue(true);
      await controller.deleteTeam({ params: { id: '5' } }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(null, 'Equipo eliminado exitosamente');
    });

    it('not found -> next(err)', async () => {
      service.deleteTeam.mockResolvedValue(false);
      await controller.deleteTeam({ params: { id: 'nf' } }, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });

  describe('addMember', () => {
    it('SUCCESS -> 200', async () => {
      const updated = { id: '6' };
      service.addMember.mockResolvedValue(updated);
      await controller.addMember({ params: { id: '6' }, body: { userId: 'u1' } }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(updated, 'Miembro agregado exitosamente');
    });

    it('team not found', async () => {
      service.addMember.mockResolvedValue(null);
      await controller.addMember({ params: { id: 'x' }, body: { userId: 'u' } }, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });

  describe('removeMember', () => {
    it('SUCCESS -> 200', async () => {
      const updated = { id: '7' };
      service.removeMember.mockResolvedValue(updated);
      await controller.removeMember({ params: { id: '7' }, body: { userId: 'u1' } }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.apiSuccess).toHaveBeenCalledWith(updated, 'Miembro removido exitosamente');
    });

    it('team not found', async () => {
      service.removeMember.mockResolvedValue(null);
      await controller.removeMember({ params: { id: 'x' }, body: { userId: 'u' } }, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ code: API_ERROR_CODES.RESOURCE_NOT_FOUND, status: 404 })
      );
    });
  });
});
