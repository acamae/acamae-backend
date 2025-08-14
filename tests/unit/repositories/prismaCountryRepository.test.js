import { PrismaCountryRepository } from '../../../src/infrastructure/repositories/PrismaCountryRepository.js';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      country: {
        findMany: jest.fn().mockResolvedValue([
          { code: 'ES', name: 'Spain' },
          { code: 'FR', name: 'France' },
        ]),
      },
    })),
  };
});

describe('PrismaCountryRepository (unit)', () => {
  it('findAll returns rows', async () => {
    const repo = new PrismaCountryRepository();
    const rows = await repo.findAll();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toHaveProperty('code');
    expect(rows[0]).toHaveProperty('name');
  });
});

