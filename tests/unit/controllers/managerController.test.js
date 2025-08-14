import { ManagerController } from '../../../src/infrastructure/controllers/ManagerController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  return res;
};

describe('ManagerController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = { getDashboard: jest.fn() };
    controller = new ManagerController(service);
    res = makeRes();
    next = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  it('getDashboard -> 200 and payload', async () => {
    const dashboard = { message: 'Manager dashboard', ts: '2020-01-01T00:00:00.000Z' };
    service.getDashboard.mockResolvedValue(dashboard);
    await controller.getDashboard({}, res, next);
    expect(service.getDashboard).toHaveBeenCalledTimes(1);
    expect(res.apiSuccess).toHaveBeenCalledWith(dashboard, 'Manager dashboard');
  });
});

