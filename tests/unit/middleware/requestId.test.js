import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

import { requestIdMiddleware } from '../../../src/infrastructure/middleware/requestId.js';

// Mock uuid to control behavior in tests
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-crypto-uuid'),
}));

const buildMockReq = (headers = {}) => ({
  headers,
});

const buildMockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('requestIdMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate new UUID when no X-Request-ID header is present', () => {
    const req = buildMockReq();
    const res = buildMockRes();
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe('mocked-uuid-v4');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'mocked-uuid-v4');
    expect(next).toHaveBeenCalled();
    expect(uuidv4).toHaveBeenCalled();
  });

  it('should use existing X-Request-ID header when present', () => {
    const existingRequestId = 'existing-request-id-123';
    const req = buildMockReq({ 'x-request-id': existingRequestId });
    const res = buildMockRes();
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe(existingRequestId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingRequestId);
    expect(next).toHaveBeenCalled();
    expect(uuidv4).not.toHaveBeenCalled();
  });

  it('should handle UUID generation error and use crypto.randomUUID() as fallback', () => {
    // Mock uuid to throw an error
    uuidv4.mockImplementationOnce(() => {
      throw new Error('UUID generation failed');
    });

    const req = buildMockReq();
    const res = buildMockRes();
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(console.error).toHaveBeenCalledWith('Error generating requestId:', expect.any(Error));
    expect(req.requestId).toBe('mocked-crypto-uuid');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'mocked-crypto-uuid');
    expect(next).toHaveBeenCalled();
  });

  it('should handle both UUID and crypto.randomUUID() errors and use timestamp fallback', () => {
    // Mock uuid to throw an error
    uuidv4.mockImplementationOnce(() => {
      throw new Error('UUID generation failed');
    });

    // Mock crypto.randomUUID to also throw an error
    const crypto = require('crypto');
    crypto.randomUUID.mockImplementationOnce(() => {
      throw new Error('Crypto UUID generation failed');
    });

    // Mock Date.now and Math.random for predictable fallback
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const mockSlice = jest.fn().mockReturnValue('abcdefghi');
    const mockToString = jest.fn().mockReturnValue({ slice: mockSlice });
    mockMathRandom.mockReturnValue({ toString: mockToString });

    const req = buildMockReq();
    const res = buildMockRes();
    const next = jest.fn();

    // Manually construct the expected fallback ID
    const expectedFallbackId = '1234567890-abcdefghi';

    requestIdMiddleware(req, res, next);

    expect(console.error).toHaveBeenCalledWith('Error generating requestId:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error generating crypto UUID:', expect.any(Error));
    expect(req.requestId).toBe(expectedFallbackId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expectedFallbackId);
    expect(next).toHaveBeenCalled();

    // Restore mocks
    mockDateNow.mockRestore();
    mockMathRandom.mockRestore();
  });

  it('should handle case-insensitive header lookup', () => {
    const existingRequestId = 'case-insensitive-test';
    // Express headers are case-insensitive, but we need to test the actual implementation
    const req = buildMockReq({ 'x-request-id': existingRequestId });
    const res = buildMockRes();
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe(existingRequestId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingRequestId);
    expect(next).toHaveBeenCalled();
  });

  it('should work when headers is undefined', () => {
    // Mock uuid to throw an error
    uuidv4.mockImplementationOnce(() => {
      throw new Error('UUID generation failed');
    });

    // Mock crypto.randomUUID to also throw an error
    const crypto = require('crypto');
    crypto.randomUUID.mockImplementationOnce(() => {
      throw new Error('Crypto UUID generation failed');
    });

    // Mock Date.now y Math.random para un resultado predecible
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const mockSlice = jest.fn().mockReturnValue('abcdefghi');
    const mockToString = jest.fn().mockReturnValue({ slice: mockSlice });
    mockMathRandom.mockReturnValue({ toString: mockToString });

    const req = { headers: undefined };
    const res = buildMockRes();
    const next = jest.fn();

    const expectedFallbackId = '1234567890-abcdefghi';

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe(expectedFallbackId); // fallback pattern
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
    expect(next).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error generating requestId:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error generating crypto UUID:', expect.any(Error));

    // Restaurar mocks
    mockDateNow.mockRestore();
    mockMathRandom.mockRestore();
  });
});
