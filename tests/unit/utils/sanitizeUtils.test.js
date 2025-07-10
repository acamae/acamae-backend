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

import sanitizeHtml from 'sanitize-html';

const buildReq = () => ({ body: {}, query: {}, params: {} });

// Mock console methods to prevent test output pollution
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('sanitize utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      expect(console.warn).toHaveBeenCalledWith(
        'sanitize-html failed, using fallback sanitization:',
        expect.any(Error)
      );
    });

    it('should handle null and undefined input', () => {
      expect(sanitizeString(null)).toBeNull();
      expect(sanitizeString(undefined)).toBeUndefined();
      expect(sanitizeString('')).toBe('');
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

  it('should handle arrays with string items in sanitizeObject', () => {
    const input = {
      mixedArray: [
        '<script>malicious</script>safe',
        42,
        true,
        { nested: '<b>bold</b>' },
        new Date('2023-01-01T00:00:00Z'),
      ],
    };
    const result = sanitizeObject(input);

    // This covers line 70: if (typeof item === 'string') return sanitizeString(item);
    expect(result.mixedArray[0]).toContain('safe');
    expect(result.mixedArray[0]).not.toMatch(/</);
    expect(result.mixedArray[1]).toBe(42);
    expect(result.mixedArray[2]).toBe(true);
    expect(result.mixedArray[3].nested).toContain('bold');
    expect(result.mixedArray[4]).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should handle arrays with only string items to cover line 70', () => {
    const input = {
      stringOnlyArray: ['<script>test1</script>', '<b>test2</b>', 'normal text'],
    };
    const result = sanitizeObject(input);

    // This specifically targets line 70: if (typeof item === 'string') return sanitizeString(item);
    result.stringOnlyArray.forEach((item) => {
      expect(typeof item).toBe('string');
      expect(item).not.toMatch(/</); // HTML should be stripped
    });
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

  it('should handle sanitizeRequest errors gracefully', () => {
    // Mock sanitizeObject to throw an error to cover lines 100-101, 113
    const originalSanitizeObject = sanitizeObject;
    jest.doMock('../../../src/shared/utils/sanitize.js', () => ({
      ...jest.requireActual('../../../src/shared/utils/sanitize.js'),
      sanitizeObject: jest.fn(() => {
        throw new Error('Sanitization failed');
      }),
    }));

    const req = buildReq();
    req.body = { test: 'value' };

    // Create a version that will actually fail
    const failingReq = {
      get query() {
        throw new Error('Query access failed');
      },
      body: req.body,
      params: req.params,
    };

    const result = sanitizeRequest(failingReq);

    expect(result).toBe(failingReq);
    expect(console.error).toHaveBeenCalledWith('Error sanitizing request:', expect.any(Error));
  });

  it('should handle requests with missing properties', () => {
    const req = {};
    const result = sanitizeRequest(req);
    expect(result).toBe(req);
  });

  it('sanitizeResponse handles strings, objects and arrays', () => {
    const response = sanitizeResponse(['<b>h</b>', { nested: '<span>k</span>' }]);
    expect(response[0]).toContain('h');
    expect(response[1].nested).toContain('k');
  });

  it('should handle sanitizeResponse with Date objects', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    const result = sanitizeResponse(date);
    expect(result).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should handle sanitizeResponse errors gracefully', () => {
    // Create a problematic object that causes errors during processing
    const problematicObject = {
      get problematic() {
        throw new Error('Property access failed');
      },
    };

    const result = sanitizeResponse(problematicObject);

    expect(result).toBe(problematicObject);
    expect(console.error).toHaveBeenCalledWith('Error sanitizing response:', expect.any(Error));
  });

  it('should handle specific error in sanitizeResponse to cover line 122', () => {
    // Create an object that will fail during sanitizeObject call
    const failingObject = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('ownKeys trap failed');
        },
        getOwnPropertyDescriptor() {
          throw new Error('getOwnPropertyDescriptor trap failed');
        },
      }
    );

    const result = sanitizeResponse(failingObject);

    // This should hit line 122: console.error('Error sanitizing response:', error);
    expect(result).toBe(failingObject);
    expect(console.error).toHaveBeenCalledWith('Error sanitizing response:', expect.any(Error));
  });

  it('should handle primitive values in sanitizeResponse', () => {
    expect(sanitizeResponse(42)).toBe(42);
    expect(sanitizeResponse(true)).toBe(true);
    expect(sanitizeResponse(null)).toBeNull();
    expect(sanitizeResponse(undefined)).toBeUndefined();
  });
});
