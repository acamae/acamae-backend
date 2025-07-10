import { jest } from '@jest/globals';

import { TeamService } from '../../src/application/services/TeamService.js';
import { makeTeam } from '../factories/teamFactory.js';
import { makeUser } from '../factories/userFactory.js';

// Mocks --------------------------------------------
const makeTeamRepo = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn(),
});

const makeUserRepo = () => ({
  findById: jest.fn(),
});

// ---------------------------------------------------

describe('TeamService', () => {
  describe('getAllTeams', () => {
    it('should return all teams', async () => {
      const teams = [makeTeam(), makeTeam()];
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue(teams);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.getAllTeams();

      expect(teamRepo.findAll).toHaveBeenCalled();
      expect(result).toBe(teams);
    });

    it('should return empty array when no teams', async () => {
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([]);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.getAllTeams();

      expect(result).toEqual([]);
    });
  });

  describe('getTeamById', () => {
    it('should throw if team not found', async () => {
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(null);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.getTeamById('1')).rejects.toThrow('Team not found');
    });

    it('should return team if found', async () => {
      const team = makeTeam();
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.getTeamById(team.id);
      expect(result).toBe(team);
    });
  });

  describe('createTeam', () => {
    it('should prevent duplicate name', async () => {
      const existing = makeTeam({ name: 'DupName' });
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([existing]);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(
        service.createTeam({ name: 'DupName', tag: 'TAG1', ownerId: '1' })
      ).rejects.toThrow('The team name already exists');
    });

    it('should prevent duplicate tag', async () => {
      const existing = makeTeam({ tag: 'DUP' });
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([existing]);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(
        service.createTeam({ name: 'Unique', tag: 'DUP', ownerId: '1' })
      ).rejects.toThrow('The team tag already exists');
    });

    it('should create team when data is unique', async () => {
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([]);
      const created = makeTeam({ name: 'New', tag: 'NEW' });
      teamRepo.create.mockResolvedValue(created);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.createTeam({ name: 'New', tag: 'NEW', ownerId: '1' });
      expect(teamRepo.create).toHaveBeenCalledWith('1', { name: 'New', tag: 'NEW' });
      expect(result).toBe(created);
    });
  });

  describe('updateTeam', () => {
    it('should update team successfully when no conflicts', async () => {
      const teamId = '1';
      const updateData = { name: 'Updated Name', tag: 'UPD' };
      const updatedTeam = makeTeam({ id: teamId, ...updateData });

      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([]);
      teamRepo.update.mockResolvedValue(updatedTeam);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.updateTeam(teamId, updateData);

      expect(teamRepo.findAll).toHaveBeenCalled();
      expect(teamRepo.update).toHaveBeenCalledWith(teamId, updateData);
      expect(result).toBe(updatedTeam);
    });

    it('should prevent duplicate name when updating', async () => {
      const teamId = '1';
      const existing = makeTeam({ id: '2', name: 'ExistingName' });
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([existing]);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(
        service.updateTeam(teamId, { name: 'ExistingName', tag: 'TAG1' })
      ).rejects.toThrow('The team name already exists');
    });

    it('should prevent duplicate tag when updating', async () => {
      const teamId = '1';
      const existing = makeTeam({ id: '2', tag: 'EXT' });
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([existing]);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.updateTeam(teamId, { name: 'NewName', tag: 'EXT' })).rejects.toThrow(
        'The team tag already exists'
      );
    });

    it('should allow updating team with its own name and tag', async () => {
      const teamId = '1';
      const existing = makeTeam({ id: teamId, name: 'SameName', tag: 'SAME' });
      const teamRepo = makeTeamRepo();
      teamRepo.findAll.mockResolvedValue([existing]);
      teamRepo.update.mockResolvedValue(existing);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.updateTeam(teamId, { name: 'SameName', tag: 'SAME' });

      expect(teamRepo.update).toHaveBeenCalledWith(teamId, { name: 'SameName', tag: 'SAME' });
      expect(result).toBe(existing);
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', async () => {
      const team = makeTeam();
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      teamRepo.delete.mockResolvedValue();
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.deleteTeam(team.id);

      expect(teamRepo.findById).toHaveBeenCalledWith(team.id);
      expect(teamRepo.delete).toHaveBeenCalledWith(team.id);
      expect(result).toBe(true);
    });

    it('should throw if team not found when deleting', async () => {
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(null);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.deleteTeam('nonexistent')).rejects.toThrow('Team not found');
      expect(teamRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    const baseTeam = () => ({ ...makeTeam(), members: [] });

    it('should throw if team not found', async () => {
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(null);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.addMember('1', 'u1')).rejects.toThrow('Team not found');
    });

    it('should throw if user not found', async () => {
      const team = baseTeam();
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      const userRepo = makeUserRepo();
      userRepo.findById.mockResolvedValue(null);
      const service = new TeamService(teamRepo, userRepo);

      await expect(service.addMember(team.id, 'u1')).rejects.toThrow('User not found');
    });

    it('should throw if user already member', async () => {
      const userId = 'u1';
      const team = { ...baseTeam(), members: [{ id: userId }] };
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      const userRepo = makeUserRepo();
      userRepo.findById.mockResolvedValue(makeUser({ id: userId }));
      const service = new TeamService(teamRepo, userRepo);

      await expect(service.addMember(team.id, userId)).rejects.toThrow(
        'The user is already a member of the team'
      );
    });

    it('should add member successfully', async () => {
      const userId = 'u1';
      const team = baseTeam();
      const updatedTeam = { ...team, members: [{ id: userId }] };
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      teamRepo.addMember.mockResolvedValue(updatedTeam);
      const userRepo = makeUserRepo();
      userRepo.findById.mockResolvedValue(makeUser({ id: userId }));
      const service = new TeamService(teamRepo, userRepo);

      const result = await service.addMember(team.id, userId);
      expect(teamRepo.addMember).toHaveBeenCalledWith(team.id, userId);
      expect(result).toBe(updatedTeam);
    });
  });

  describe('removeMember', () => {
    const ownerId = 'owner1';
    const memberId = 'member1';

    const makeFullTeam = () => ({
      ...makeTeam(),
      ownerId,
      members: [{ id: ownerId }, { id: memberId }],
    });

    it('should throw if team not found when removing member', async () => {
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(null);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.removeMember('nonexistent', memberId)).rejects.toThrow('Team not found');
    });

    it('should throw if user not member', async () => {
      const team = { ...makeTeam(), ownerId, members: [{ id: ownerId }] };
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.removeMember(team.id, memberId)).rejects.toThrow(
        'The user is not a member of the team'
      );
    });

    it('should throw if trying to remove owner', async () => {
      const team = makeFullTeam();
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      const service = new TeamService(teamRepo, makeUserRepo());

      await expect(service.removeMember(team.id, ownerId)).rejects.toThrow(
        'Cannot remove the team owner'
      );
    });

    it('should remove member successfully', async () => {
      const team = makeFullTeam();
      const updatedTeam = { ...team, members: [{ id: ownerId }] };
      const teamRepo = makeTeamRepo();
      teamRepo.findById.mockResolvedValue(team);
      teamRepo.removeMember.mockResolvedValue(updatedTeam);
      const service = new TeamService(teamRepo, makeUserRepo());

      const result = await service.removeMember(team.id, memberId);
      expect(teamRepo.removeMember).toHaveBeenCalledWith(team.id, memberId);
      expect(result).toBe(updatedTeam);
    });
  });
});
