import { ProfileService } from '../../../../src/application/services/ProfileService.js';

describe('ProfileService (unit)', () => {
  const makeRepo = () => ({
    findById: jest.fn(),
    findUserGames: jest.fn(),
    getUserTimezone: jest.fn(),
    getUserCountry: jest.fn(),
    setUserCountry: jest.fn(),
    setUserTimezone: jest.fn(),
    addGame: jest.fn(),
    removeGame: jest.fn(),
  });

  it('getUserProfile returns merged public payload', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue({ id: '12', userId: '9', isActive: false });
    repo.findUserGames.mockResolvedValue([]);
    repo.getUserTimezone.mockResolvedValue('Europe/Madrid');
    repo.getUserCountry.mockResolvedValue({ toJSON: () => ({ code: 'ES', name: 'Spain' }) });

    const svc = new ProfileService(repo);
    const result = await svc.getUserProfile('12');
    expect(result.user.id).toBe('12');
    expect(result.games).toEqual([]);
    expect(result.timezone).toBe('Europe/Madrid');
    expect(result.country).toEqual({ code: 'ES', name: 'Spain' });
  });

  it('addGame delegates and formats response', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue({ id: '12' });
    repo.addGame.mockResolvedValue(true);
    const svc = new ProfileService(repo);
    const result = await svc.addGame('12', 7);
    expect(repo.addGame).toHaveBeenCalledWith('12', 7);
    expect(result).toEqual({ gameId: 7, selected: true, profileIsActive: true });
  });

  it('removeGame delegates and formats response', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue({ id: '12' });
    repo.removeGame.mockResolvedValue(false);
    const svc = new ProfileService(repo);
    const result = await svc.removeGame('12', 7);
    expect(repo.removeGame).toHaveBeenCalledWith('12', 7);
    expect(result).toEqual({ gameId: 7, selected: false, profileIsActive: false });
  });

  it('getUserTimezone returns timezone and active flag', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue({ id: '12' });
    repo.getUserTimezone.mockResolvedValue('Europe/Madrid');
    const svc = new ProfileService(repo);
    const result = await svc.getUserTimezone('12');
    expect(repo.getUserTimezone).toHaveBeenCalledWith('12');
    expect(result).toEqual({ timezone: 'Europe/Madrid', profileIsActive: true });
  });

  it('setUserTimezone persists and returns active flag', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue({ id: '12' });
    repo.setUserTimezone.mockResolvedValue(true);
    const svc = new ProfileService(repo);
    const result = await svc.setUserTimezone('12', 'Europe/Paris');
    expect(repo.setUserTimezone).toHaveBeenCalledWith('12', 'Europe/Paris');
    expect(result).toEqual({ timezone: 'Europe/Paris', profileIsActive: true });
  });
});
