import { ProfileController } from '../../../src/infrastructure/controllers/ProfileController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  return res;
};

describe('ProfileController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = {
      findById: jest.fn(),
      addGame: jest.fn(),
      removeGame: jest.fn(),
      replaceAvailability: jest.fn(),
      getAvailability: jest.fn(),
      getUserTimezone: jest.fn(),
      setUserTimezone: jest.fn(),
      getUserCountry: jest.fn(),
      setUserCountry: jest.fn(),
      getUserProfile: jest.fn(),
    };
    controller = new ProfileController(service);
    res = makeRes();
    next = jest.fn();
  });

  it('addGame -> 200 payload', async () => {
    const payload = { gameId: 7, selected: true, profileIsActive: true };
    service.addGame.mockResolvedValue(payload);
    const req = { params: { id: '12' }, body: { gameId: 7 } };
    await controller.addGame(req, res, next);
    expect(service.addGame).toHaveBeenCalledWith('12', 7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Game added to profile');
  });

  it('removeGame -> 200 payload', async () => {
    const payload = { gameId: 7, selected: false, profileIsActive: false };
    service.removeGame.mockResolvedValue(payload);
    const req = { params: { id: '12' }, body: { gameId: 7 } };
    await controller.removeGame(req, res, next);
    expect(service.removeGame).toHaveBeenCalledWith('12', 7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Game removed from profile');
  });

  it('getUserProfile -> 200', async () => {
    const payload = {
      profile: { id: '12' },
      games: [],
      timezone: 'Europe/Madrid',
      country: { code: 'ES' },
    };
    service.getUserProfile.mockResolvedValue(payload);
    const req = { params: { id: '12' } };
    await controller.getUserProfile(req, res, next);
    expect(service.getUserProfile).toHaveBeenCalledWith('12');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'User profile retrieved');
  });

  it('getUserTimezone -> 200', async () => {
    const payload = { timezone: 'Europe/Madrid', profileIsActive: true };
    service.getUserTimezone.mockResolvedValue(payload);
    const req = { params: { id: '12' } };
    await controller.getUserTimezone(req, res, next);
    expect(service.getUserTimezone).toHaveBeenCalledWith('12');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Timezones retrieved');
  });

  it('setUserTimezone -> 200', async () => {
    const payload = { timezone: 'Europe/Paris', profileIsActive: true };
    service.setUserTimezone.mockResolvedValue(payload);
    const req = { params: { id: '12' }, body: { timezone: 'Europe/Paris' } };
    await controller.setUserTimezone(req, res, next);
    expect(service.setUserTimezone).toHaveBeenCalledWith('12', 'Europe/Paris');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(payload, 'Timezone updated');
  });
});
