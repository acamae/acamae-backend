import { PrismaProfileRepository } from '../../../src/infrastructure/repositories/PrismaProfileRepository.js';

// Mocked PrismaClient shape used by PrismaProfileRepository
const mockPrisma = {
  userProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setActive: jest.fn(), // not a real Prisma method, repository calls setActive wrapper, but keep for safety
  },
  gameProfile: {
    upsert: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PrismaProfileRepository', () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PrismaProfileRepository();
  });

  describe('findById', () => {
    it('returns mapped profile', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 12,
        user_id: 9,
        country_code: 'ES',
        timezone: 'Europe/Madrid',
        bio: null,
        discord_id: null,
        riot_id: null,
        profile_image_filename: null,
        is_active: true,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      });

      const result = await repo.findById('12');
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({ where: { id: 12 } });
      expect(result).toMatchObject({
        id: '12',
        userId: '9',
        countryCode: 'ES',
        timezone: 'Europe/Madrid',
        isActive: true,
      });
    });
  });

  describe('addGame/removeGame', () => {
    it('addGame upserts by profile_id + game_id and recalculates active', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        country_code: 'ES',
        timezone: 'Europe/Madrid',
      });
      mockPrisma.gameProfile.count.mockResolvedValue(1);
      mockPrisma.userProfile.update.mockResolvedValue({ id: 12, is_active: true });

      const isActive = await repo.addGame('12', 7);

      expect(mockPrisma.gameProfile.upsert).toHaveBeenCalledWith({
        where: { profile_id_game_id: { profile_id: 12, game_id: 7 } },
        update: {},
        create: { profile_id: 12, game_id: 7 },
      });
      // recalc: findUnique(id), count(profile_id), update to active
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 12 },
        select: { country_code: true, timezone: true },
      });
      expect(mockPrisma.gameProfile.count).toHaveBeenCalledWith({ where: { profile_id: 12 } });
      expect(isActive).toBe(true);
    });

    it('removeGame deletes found gp and recalculates active', async () => {
      mockPrisma.gameProfile.findFirst.mockResolvedValue({ id: 123 });
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        country_code: null,
        timezone: 'Europe/Madrid',
      });
      mockPrisma.gameProfile.count.mockResolvedValue(0);
      mockPrisma.userProfile.update.mockResolvedValue({ id: 12, is_active: false });

      const isActive = await repo.removeGame('12', 7);

      expect(mockPrisma.gameProfile.findFirst).toHaveBeenCalledWith({
        where: { profile_id: 12, game_id: 7 },
        select: { id: true },
      });
      expect(mockPrisma.gameProfile.delete).toHaveBeenCalledWith({ where: { id: 123 } });
      expect(mockPrisma.gameProfile.count).toHaveBeenCalledWith({ where: { profile_id: 12 } });
      expect(isActive).toBe(false);
    });
  });

  describe('findUserGames', () => {
    it('maps joined games', async () => {
      mockPrisma.gameProfile.findMany.mockResolvedValue([
        { game: { id: 2, code: 'lol', name_code: 'game.lol', image_filename: 'lol.png' } },
      ]);

      const result = await repo.findUserGames('12');
      expect(mockPrisma.gameProfile.findMany).toHaveBeenCalledWith({
        where: { profile_id: 12 },
        select: {
          game: { select: { id: true, code: true, name_code: true, image_filename: true } },
        },
        orderBy: { game_id: 'asc' },
      });
      expect(result).toEqual([
        { id: 2, code: 'lol', nameCode: 'game.lol', imageFilename: 'lol.png' },
      ]);
    });
  });

  describe('timezone & country', () => {
    it('getUserTimezone returns timezone from id', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({ timezone: 'Europe/Madrid' });
      const tz = await repo.getUserTimezone('12');
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 12 },
        select: { timezone: true },
      });
      expect(tz).toBe('Europe/Madrid');
    });

    it('setUserTimezone updates and recalculates', async () => {
      mockPrisma.userProfile.update.mockResolvedValue({ id: 12 });
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        country_code: 'ES',
        timezone: 'Europe/Madrid',
      });
      mockPrisma.gameProfile.count.mockResolvedValue(1);
      const result = await repo.setUserTimezone('12', 'Europe/Madrid');
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { timezone: 'Europe/Madrid' },
      });
      expect(result).toBe(true);
    });

    it('get/set country by profileId', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({ country_code: 'ES' });
      const c = await repo.getUserCountry('12');
      expect(c).toBe('ES');
      mockPrisma.userProfile.update.mockResolvedValue({ country_code: 'FR' });
      const c2 = await repo.setUserCountry('12', 'FR');
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { country_code: 'FR' },
      });
      expect(c2).toBe('FR');
    });
  });
});
