import { jest } from '@jest/globals';

import { timeoutMiddleware } from '../../../src/infrastructure/middleware/timeout.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

describe('timeoutMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();

    // Reset mocks
    jest.clearAllMocks();

    // Mock request object
    req = {
      headers: {},
      method: 'GET',
      url: '/test',
    };

    // Mock response object
    res = {
      headersSent: false,
      apiError: jest.fn(),
      on: jest.fn(),
    };

    // Mock next function
    next = jest.fn();
  });

  afterEach(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should return a function', () => {
      const middleware = timeoutMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call next() immediately', () => {
      const middleware = timeoutMiddleware();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should register event handlers', () => {
      const middleware = timeoutMiddleware();

      middleware(req, res, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('timeout behavior', () => {
    it('should trigger timeout after default 30000ms', () => {
      const middleware = timeoutMiddleware();

      middleware(req, res, next);

      // Fast-forward to just before timeout
      jest.advanceTimersByTime(29999);
      expect(res.apiError).not.toHaveBeenCalled();

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of 30000ms',
            },
          ],
        })
      );
    });

    it('should trigger timeout with custom timeout value', () => {
      const middleware = timeoutMiddleware(1500);

      middleware(req, res, next);

      // Fast-forward to just before timeout
      jest.advanceTimersByTime(1499);
      expect(res.apiError).not.toHaveBeenCalled();

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of 1500ms',
            },
          ],
        })
      );
    });

    it('should trigger timeout immediately with zero timeout', () => {
      const middleware = timeoutMiddleware(0);

      middleware(req, res, next);

      // Should timeout immediately
      jest.advanceTimersByTime(1);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of 0ms',
            },
          ],
        })
      );
    });

    it('should trigger timeout immediately with negative timeout', () => {
      const middleware = timeoutMiddleware(-1000);

      middleware(req, res, next);

      // Should timeout immediately
      jest.advanceTimersByTime(1);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of -1000ms',
            },
          ],
        })
      );
    });
  });

  describe('response handling', () => {
    it('should not call apiError if headers are already sent', () => {
      const middleware = timeoutMiddleware(1000);
      res.headersSent = true;

      middleware(req, res, next);

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1001);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should clear timeout when response finishes', () => {
      const middleware = timeoutMiddleware(1000);

      middleware(req, res, next);

      // Get the finish handler
      const finishHandler = res.on.mock.calls.find((call) => call[0] === 'finish')[1];

      // Simulate response finish
      finishHandler();

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1001);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should clear timeout when response closes', () => {
      const middleware = timeoutMiddleware(1000);

      middleware(req, res, next);

      // Get the close handler
      const closeHandler = res.on.mock.calls.find((call) => call[0] === 'close')[1];

      // Simulate response close
      closeHandler();

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1001);
      expect(res.apiError).not.toHaveBeenCalled();
    });

    it('should call apiError only once even if timeout triggers multiple times', () => {
      const middleware = timeoutMiddleware(1000);

      middleware(req, res, next);

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1001);
      expect(res.apiError).toHaveBeenCalledTimes(1);

      // Fast-forward again
      jest.advanceTimersByTime(1000);
      expect(res.apiError).toHaveBeenCalledTimes(1);
    });
  });

  describe('parameter handling', () => {
    it('should handle undefined timeout parameter', () => {
      const middleware = timeoutMiddleware(undefined);

      middleware(req, res, next);

      // Should use default timeout
      jest.advanceTimersByTime(30000);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of 30000ms',
            },
          ],
        })
      );
    });

    it('should handle null timeout parameter', () => {
      const middleware = timeoutMiddleware(null);

      middleware(req, res, next);

      // Should use null as timeout value (not default)
      jest.advanceTimersByTime(1);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of nullms',
            },
          ],
        })
      );
    });

    it('should handle string timeout parameter', () => {
      const middleware = timeoutMiddleware('1500');

      middleware(req, res, next);

      // Should convert string to number
      jest.advanceTimersByTime(1500);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of 1500ms',
            },
          ],
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should work with different timeout values', () => {
      const values = [0, 500, 1000, 1500];

      values.forEach((timeout) => {
        const middleware = timeoutMiddleware(timeout);
        expect(typeof middleware).toBe('function');

        middleware(req, res, next);
        expect(next).toHaveBeenCalledWith();

        // Clear mocks for next iteration
        jest.clearAllMocks();
      });
    });

    it('should handle very large timeout values', () => {
      const middleware = timeoutMiddleware(1800);

      middleware(req, res, next);

      // Fast-forward to just before timeout
      jest.advanceTimersByTime(1799);
      expect(res.apiError).not.toHaveBeenCalled();

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(1);
      expect(res.apiError).toHaveBeenCalledWith(
        HTTP_STATUS.REQUEST_TIMEOUT,
        API_ERROR_CODES.ETIMEDOUT,
        'Request timeout - the operation took too long to complete',
        expect.objectContaining({
          type: 'server',
          details: [
            {
              field: 'timeout',
              code: 'REQUEST_TIMEOUT',
              message: 'Request exceeded timeout of 1800ms',
            },
          ],
        })
      );
    });
  });
});
