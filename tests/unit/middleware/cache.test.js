import {
  cacheFromLoader,
  cachePublicSimple,
} from '../../../src/infrastructure/middleware/cache.js';

const makeRes = () => {
  const res = {};
  res.set = jest.fn().mockReturnValue(res);
  res.removeHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.end = jest.fn();
  res.locals = {};
  return res;
};

describe('cache middleware', () => {
  afterEach(() => jest.clearAllMocks());

  describe('cachePublicSimple', () => {
    it('sets no-store on development/local', () => {
      const middleware = cachePublicSimple({ config: { env: 'development' } });
      const req = {};
      const res = makeRes();
      const next = jest.fn();
      middleware(req, res, next);
      expect(res.removeHeader).toHaveBeenCalledWith('Pragma');
      expect(res.removeHeader).toHaveBeenCalledWith('Expires');
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(next).toHaveBeenCalled();
    });

    it('sets public, max-age on production', () => {
      const middleware = cachePublicSimple({ config: { env: 'production' }, maxAgeSeconds: 123 });
      const req = {};
      const res = makeRes();
      const next = jest.fn();
      middleware(req, res, next);
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=123, must-revalidate');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('cacheFromLoader', () => {
    it('attaches data to res.locals and sets no-store on dev', async () => {
      const load = jest.fn().mockResolvedValue({ raw: '{"ok":true}', json: { ok: true } });
      const middleware = cacheFromLoader({ load, config: { env: 'development' } });
      const req = { headers: {} };
      const res = makeRes();
      const next = jest.fn();
      await middleware(req, res, next);
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(res.locals.__cacheJson).toEqual({ ok: true });
      expect(next).toHaveBeenCalled();
    });

    it('sets ETag and returns 304 when If-None-Match matches in non-dev', async () => {
      const raw = '{"a":1}';
      const load = jest
        .fn()
        .mockResolvedValue({ raw, json: { a: 1 }, mtime: new Date('2025-01-01') });
      const middleware = cacheFromLoader({
        load,
        config: { env: 'production' },
        maxAgeSeconds: 60,
      });
      const req = { headers: {} };
      const res = makeRes();
      const next = jest.fn();

      // First pass to compute ETag (we capture from res.set calls)
      await middleware(req, res, next);
      const etagCall = res.set.mock.calls.find((c) => c[0] === 'ETag');
      expect(etagCall).toBeTruthy();
      const etag = etagCall[1];

      // Second pass with matching If-None-Match
      const res2 = makeRes();
      const req2 = { headers: { 'if-none-match': etag } };
      await middleware(req2, res2, next);
      expect(res2.status).toHaveBeenCalledWith(304);
      expect(res2.end).toHaveBeenCalled();
    });

    it('calls next(error) when loader throws', async () => {
      const load = jest.fn().mockRejectedValue(new Error('load fail'));
      const middleware = cacheFromLoader({ load, config: { env: 'production' } });
      const req = { headers: {} };
      const res = makeRes();
      const next = jest.fn();
      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
