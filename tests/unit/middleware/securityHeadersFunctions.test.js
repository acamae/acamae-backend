// Desactivar el mock global para security.js definido en jest.setup.js
jest.unmock(require.resolve('../../../src/infrastructure/middleware/security.js'));

const {
  cspMiddleware,
  preventClickjacking,
  preventMimeSniffing,
  preventXSS,
  preventIEOpen,
  noCache,
} = require('../../../src/infrastructure/middleware/security.js');

describe('security header helper middlewares', () => {
  const buildRes = () => {
    const headers = {};
    return {
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      removeHeader: jest.fn(),
      get headers() {
        return headers;
      },
    };
  };

  const req = {};

  it('cspMiddleware sets CSP header', () => {
    const res = buildRes();
    const next = jest.fn();
    cspMiddleware(req, res, next);
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('preventClickjacking sets X-Frame-Options', () => {
    const res = buildRes();
    preventClickjacking(req, res, jest.fn());
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('preventMimeSniffing sets X-Content-Type-Options', () => {
    const res = buildRes();
    preventMimeSniffing(req, res, jest.fn());
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('preventXSS sets X-XSS-Protection', () => {
    const res = buildRes();
    preventXSS(req, res, jest.fn());
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
  });

  it('preventIEOpen sets X-Download-Options', () => {
    const res = buildRes();
    preventIEOpen(req, res, jest.fn());
    expect(res.headers['x-download-options']).toBe('noopen');
  });

  it('noCache sets cache prevention headers', () => {
    const res = buildRes();
    noCache(req, res, jest.fn());
    expect(res.headers['surrogate-control']).toBe('no-store');
    expect(res.headers['cache-control']).toContain('no-cache');
  });
});
