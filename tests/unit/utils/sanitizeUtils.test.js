import { escape } from 'html-escaper';

import {
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObject,
  sanitizeRequest,
  sanitizeResponse,
  sanitizeString,
} from '../../../src/shared/utils/sanitize.js';

// Caso: forzar que sanitize-html falle para probar fallback
jest.mock('sanitize-html', () => {
  const original = jest.requireActual('sanitize-html');
  const mockFn = jest.fn((html, _opts) => original(html));
  mockFn.shouldThrow = false;
  return mockFn;
});

const sanitizeHtml = require('sanitize-html');

const buildReq = () => ({ body: {}, query: {}, params: {} });

describe('sanitize utils', () => {
  describe('sanitizeString', () => {
    it('removes html tags', () => {
      const dirty = '<script>alert(1)</script>hello';
      const result = sanitizeString(dirty);
      expect(result).toContain('hello');
      expect(result).not.toMatch(/</);
    });

    it('falls back when sanitize-html throws', () => {
      sanitizeHtml.mockImplementationOnce(() => {
        throw new Error('boom');
      });
      const dirty = '<b>bold</b>';
      // should return escaped text without tags
      expect(sanitizeString(dirty)).toBe(escape(dirty));
    });
  });

  it('sanitizeEmail lowercases and sanitizes', () => {
    const mixed = 'User@Example.COM';
    const result = sanitizeEmail(mixed);
    expect(result).toBe('user@example.com');
  });

  describe('sanitizeNumber', () => {
    it('parses numeric strings', () => {
      expect(sanitizeNumber('10')).toBe(10);
    });
    it('returns 0 for NaN', () => {
      expect(sanitizeNumber('abc')).toBe(0);
    });
  });

  it('sanitizeObject recursively cleans strings and dates', () => {
    const date = new Date('2020-01-01T00:00:00Z');
    const input = {
      unsafe: '<img src=x onerror=alert(1)>text',
      nested: { dirty: '<script>x</script>' },
      list: ['<b>a</b>', date],
      date,
    };
    const out = sanitizeObject(input);
    expect(out.unsafe).toContain('text');
    expect(out.unsafe).not.toMatch(/</);
    expect(out.nested.dirty).toContain('x');
    expect(out.list[0]).toContain('a');
    expect(out.list[0]).not.toMatch(/</);
    expect(out.list[1]).toBe(date.toISOString());
    expect(out.date).toBe(date.toISOString());
  });

  it('sanitizeRequest cleans all parts of express request object', () => {
    const req = buildReq();
    req.body = { a: '<i>x</i>' };
    req.query = { q: '<b>y</b>' };
    req.params = { id: '<script>z</script>' };
    sanitizeRequest(req);
    expect(req.body.a).toContain('x');
    expect(req.body.a).not.toMatch(/</);
    expect(req.query.q).toContain('y');
    expect(req.query.q).not.toMatch(/</);
    expect(req.params.id).toContain('z');
    expect(req.params.id).not.toMatch(/</);
  });

  it('sanitizeResponse handles strings, objects and arrays', () => {
    const response = sanitizeResponse(['<b>h</b>', { nested: '<span>k</span>' }]);
    expect(response[0]).toContain('h');
    expect(response[1].nested).toContain('k');
  });
});
