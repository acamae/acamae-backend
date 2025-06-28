import { PrismaClient } from '@prisma/client';

import { PrismaTeamRepository } from '../../../src/infrastructure/repositories/PrismaTeamRepository.js';

const mockPrisma = {
  team: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));

describe('PrismaTeamRepository', () => {
  let repo;
  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PrismaTeamRepository();
  });

  const dbTeam = {
    id: 1,
    userId: 2,
    name: 'Dev',
    tag: 'DEV',
    logo_filename: null,
    description: null,
    created_at: new Date('2020-01-01'),
    updated_at: new Date('2020-01-02'),
    user: {
      id: 2,
      username: 'user',
      email: 'u@a.com',
      password_hash: 'hashed',
      role: 'user',
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  it('findAll mapea correctamente', async () => {
    mockPrisma.team.findMany.mockResolvedValue([dbTeam]);
    const res = await repo.findAll();
    expect(res[0]).toMatchObject({ id: '1', name: 'Dev', user: { id: '2' } });
  });

  it('findById devuelve dominio', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(dbTeam);
    const team = await repo.findById('1');
    expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { user: true },
    });
    expect(team.id).toBe('1');
  });

  it('create y update delegan en prisma', async () => {
    mockPrisma.team.create.mockResolvedValue(dbTeam);
    const created = await repo.create('2', { name: 'Dev' });
    expect(created.id).toBe('1');

    mockPrisma.team.update.mockResolvedValue({ ...dbTeam, name: 'New' });
    const updated = await repo.update('1', { name: 'New' });
    expect(updated.name).toBe('New');
  });

  it('addMember y removeMember', async () => {
    mockPrisma.team.update.mockResolvedValue(dbTeam);
    await repo.addMember('1', '3');
    expect(mockPrisma.team.update).toHaveBeenCalled();
    await repo.removeMember('1', '3');
    expect(mockPrisma.team.update).toHaveBeenCalled();
  });

  it('findByUserId y delete', async () => {
    mockPrisma.team.findMany.mockResolvedValue([dbTeam]);
    const list = await repo.findByUserId('2');
    expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
      where: { userId: 2 },
      include: { user: true },
    });
    expect(list).toHaveLength(1);

    mockPrisma.team.delete.mockResolvedValue({});
    await repo.delete('1');
    expect(mockPrisma.team.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
