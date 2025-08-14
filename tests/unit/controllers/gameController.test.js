import { GameController } from '../../../src/infrastructure/controllers/GameController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  return res;
};

describe('GameController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = { listGames: jest.fn() };
    controller = new GameController(service);
    res = makeRes();
    next = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  it('listGames -> 200 and payload', async () => {
    const games = [{ id: 1, code: 'lol' }];
    service.listGames.mockResolvedValue(games);
    await controller.listGames({}, res, next);
    expect(service.listGames).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith({ games }, 'Games catalog');
    expect(next).not.toHaveBeenCalled();
  });

  it('listGames -> passes error to next', async () => {
    const err = new Error('db');
    service.listGames.mockRejectedValue(err);
    await controller.listGames({}, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

