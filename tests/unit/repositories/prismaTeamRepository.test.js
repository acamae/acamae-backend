import { PrismaTeamRepository } from '../../../src/infrastructure/repositories/PrismaTeamRepository.js';

const mockPrisma = {
  team: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock @prisma/client to prevent real database connections
jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PrismaTeamRepository', () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PrismaTeamRepository();
  });

  it('correctly maps findAll results', async () => {
    mockPrisma.team.findMany.mockResolvedValue([{ id: 1, name: 'Team Alpha', userId: 1 }]);

    const teams = await repo.findAll();

    expect(mockPrisma.team.findMany).toHaveBeenCalled();
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject({
      id: '1',
      name: 'Team Alpha',
      userId: '1',
    });
  });

  it('correctly returns domain objects from findById', async () => {
    mockPrisma.team.findUnique.mockResolvedValue({
      id: 1,
      name: 'Team Alpha',
      userId: 1,
    });

    const team = await repo.findById('1');

    expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { user: true },
    });
    expect(team.userId).toBe('1');
  });

  it('correctly delegates create and update to prisma', async () => {
    const teamData = { name: 'New Team', tag: 'NT' };
    mockPrisma.team.create.mockResolvedValue({
      id: 1,
      name: 'New Team',
      tag: 'NT',
      userId: 1,
    });

    const created = await repo.create('1', teamData);

    expect(mockPrisma.team.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        name: 'New Team',
      }),
      include: { user: true },
    });
    expect(created.id).toBe('1');

    mockPrisma.team.update.mockResolvedValue({
      id: 1,
      name: 'Updated Team',
      userId: 1,
    });

    const updated = await repo.update('1', { name: 'Updated Team' });

    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Updated Team' },
      include: { user: true },
    });
    expect(updated.name).toBe('Updated Team');
  });

  it('correctly handles addMember and removeMember operations', async () => {
    const teamWithMembers = {
      id: 1,
      name: 'Team Alpha',
      userId: 1,
      members: [{ id: 1 }],
    };

    mockPrisma.team.update.mockResolvedValue(teamWithMembers);

    const resultAdd = await repo.addMember('1', '2');
    const resultRemove = await repo.removeMember('1', '1');

    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { members: { connect: { id: 2 } } },
      include: { user: true, members: true },
    });

    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { members: { disconnect: { id: 1 } } },
      include: { user: true, members: true },
    });

    expect(resultAdd).toBeDefined();
    expect(resultRemove).toBeDefined();
  });

  it('correctly handles findByUserId and delete operations', async () => {
    mockPrisma.team.findMany.mockResolvedValue([{ id: 1, name: 'User Team', userId: 1 }]);

    const userTeams = await repo.findByUserId('1');

    expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      include: { user: true },
    });
    expect(userTeams).toHaveLength(1);

    mockPrisma.team.delete.mockResolvedValue({ id: 1 });

    const deleteResult = await repo.delete('1');

    expect(mockPrisma.team.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(deleteResult).toBeUndefined(); // delete returns void
  });
});
