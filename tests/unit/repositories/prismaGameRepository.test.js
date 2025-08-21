import { PrismaGameRepository } from '../../../src/infrastructure/repositories/PrismaGameRepository.js';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      game: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 1, code: 'lol', name_code: 'n', image_filename: 'a.png' }]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 1 || where.code === 'lol') {
            return Promise.resolve({ id: 1, code: 'lol', name_code: 'n', image_filename: 'a.png' });
          }
          return Promise.resolve(null);
        }),
      },
    })),
  };
});

describe('PrismaGameRepository (unit)', () => {
  let repo;
  beforeEach(() => {
    repo = new PrismaGameRepository();
  });

  it('findAll maps to domain model', async () => {
    const list = await repo.findAll();
    expect(list).toEqual([{ id: 1, code: 'lol', nameCode: 'n', imageFilename: 'a.png' }]);
  });

  it('findById returns one', async () => {
    const game = await repo.findById(1);
    expect(game).toEqual({ id: 1, code: 'lol', nameCode: 'n', imageFilename: 'a.png' });
  });

  it('findByCode returns one', async () => {
    const game = await repo.findByCode('lol');
    expect(game).toEqual({ id: 1, code: 'lol', nameCode: 'n', imageFilename: 'a.png' });
  });
});
