import { AdminController } from '../../../src/infrastructure/controllers/AdminController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  return res;
};

describe('AdminController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = { getStats: jest.fn() };
    controller = new AdminController(service);
    res = makeRes();
    next = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  it('getStats -> 200 and payload', async () => {
    const stats = { users: { total: 1 }, teams: { total: 2 }, system: { uptime: 1 } };
    service.getStats.mockResolvedValue(stats);
    await controller.getStats({}, res, next);
    expect(service.getStats).toHaveBeenCalledTimes(1);
    expect(res.apiSuccess).toHaveBeenCalledWith(stats, 'Admin stats');
  });
});
