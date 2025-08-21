import { CountriesController } from '../../../src/infrastructure/controllers/CountriesController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.removeHeader = jest.fn();
  return res;
};

describe('CountriesController (unit)', () => {
  let service;
  let controller;
  let res;
  let next;

  beforeEach(() => {
    service = { listCountries: jest.fn() };
    controller = new CountriesController(service);
    res = makeRes();
    next = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  it('uses cached data if present in res.locals', async () => {
    const cached = { countries: [{ code: 'ES', name: 'Spain' }] };
    const req = {};
    res.locals = { __cacheJson: cached };
    await controller.getCountries(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.apiSuccess).toHaveBeenCalledWith(cached, 'Countries catalog');
    expect(service.listCountries).not.toHaveBeenCalled();
  });

  it('delegates to service when no cache', async () => {
    const req = {};
    res.locals = {};
    const data = { countries: [{ code: 'FR', name: 'France' }] };
    service.listCountries.mockResolvedValue(data);
    await controller.getCountries(req, res, next);
    expect(service.listCountries).toHaveBeenCalledTimes(1);
    expect(res.apiSuccess).toHaveBeenCalledWith(data, 'Countries catalog');
  });
});
