import { API_ERROR_CODES, ERROR_MESSAGES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';
import { createError } from '../../../src/shared/utils/error.js';

describe('error utils', () => {
  describe('createError', () => {
    it('creates error from options object', () => {
      const err = createError({
        message: 'Boom',
        code: API_ERROR_CODES.CONFLICT,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'validation',
          details: [{ field: 'email', message: 'Invalid email' }],
        },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Boom');
      expect(err.code).toBe(API_ERROR_CODES.CONFLICT);
      expect(err.status).toBe(HTTP_STATUS.CONFLICT);
      expect(err.error).toEqual({
        type: 'validation',
        details: [{ field: 'email', message: 'Invalid email' }],
      });
    });

    it('creates error with defaults when message passed as string', () => {
      // Test backward compatibility - should still work if someone passes a string
      const err = createError({ message: 'Something happened' });
      expect(err.message).toBe('Something happened');
      expect(err.code).toBe(API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      expect(err.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('creates error with all default values when no options provided', () => {
      const err = createError();
      expect(err.message).toBe(ERROR_MESSAGES[API_ERROR_CODES.INTERNAL_SERVER_ERROR]);
      expect(err.code).toBe(API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      expect(err.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('creates error with custom timestamp and requestId', () => {
      const customTimestamp = '2023-01-01T00:00:00.000Z';
      const customRequestId = 'custom-request-id';

      const err = createError({
        message: 'Custom error',
        timestamp: customTimestamp,
        requestId: customRequestId,
      });

      expect(err.message).toBe('Custom error');
      expect(err.timestamp).toBe(customTimestamp);
      expect(err.requestId).toBe(customRequestId);
    });

    it('creates error with success and data fields', () => {
      const err = createError({
        message: 'Error with data',
        success: true,
        data: { some: 'data' },
      });

      expect(err.message).toBe('Error with data');
      expect(err.success).toBe(true);
      expect(err.data).toEqual({ some: 'data' });
    });
  });
});
