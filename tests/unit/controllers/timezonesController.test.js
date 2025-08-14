import { TimezonesController } from '../../../src/infrastructure/controllers/TimezonesController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.apiSuccess = jest.fn().mockReturnValue(res);
  res.apiError = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.removeHeader = jest.fn();
  res.locals = {};
  return res;
};

describe('TimezonesController (unit)', () => {
  it('uses cache locals when available', async () => {
    const controller = new TimezonesController({ env: 'test' });
    const req = {};
    const res = makeRes();
    res.locals.__cacheJson = { version: 'x', timezones: [] };
    const next = jest.fn();
    await controller.getTimezones(req, res, next);
    expect(res.apiSuccess).toHaveBeenCalledWith(
      { version: 'x', timezones: [] },
      'Timezones catalog'
    );
  });

  it('loads via injected loader when no cache', async () => {
    const loader = jest.fn().mockResolvedValue({ json: { version: 'z', timezones: [] } });
    const controller = new TimezonesController({ env: 'test' }, { load: loader });
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    await controller.getTimezones(req, res, next);
    expect(res.apiSuccess).toHaveBeenCalledWith(
      { version: 'z', timezones: [] },
      'Timezones catalog'
    );
  });
});
