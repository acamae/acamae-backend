import { API_ERROR_CODES, ERROR_MESSAGES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';
import {
  createError,
  handleConflictError,
  handleError,
  handleForbiddenError,
  handleNotFoundError,
  handleUnauthorizedError,
  handleValidationError,
} from '../../../src/shared/utils/error.js';

describe('error utils', () => {
  describe('createError', () => {
    it('creates error from options object', () => {
      const err = createError({
        message: 'Boom',
        code: API_ERROR_CODES.CONFLICT,
        status: HTTP_STATUS.CONFLICT,
        details: { field: 'email' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Boom');
      expect(err.code).toBe(API_ERROR_CODES.CONFLICT);
      expect(err.status).toBe(HTTP_STATUS.CONFLICT);
      expect(err.details).toEqual({ field: 'email' });
    });

    it('creates error with defaults when params passed', () => {
      const err = createError('Something happened');
      expect(err.message).toBe('Something happened');
      expect(err.code).toBe(API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      expect(err.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  it('handleError formats generic error', () => {
    const error = Object.assign(new Error('Oops'), {
      code: API_ERROR_CODES.UNAUTHORIZED,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
    const handled = handleError(error);
    expect(handled).toEqual({
      status: HTTP_STATUS.UNAUTHORIZED,
      code: API_ERROR_CODES.UNAUTHORIZED,
      message: 'Oops',
    });
  });

  it('handleValidationError returns details', () => {
    const details = [{ field: 'email', message: 'Invalid' }];
    const result = handleValidationError(details);
    expect(result).toEqual({
      status: HTTP_STATUS.BAD_REQUEST,
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR],
      details,
    });
  });

  it('shortcut handlers generate expected structures', () => {
    expect(handleNotFoundError()).toMatchObject({ code: API_ERROR_CODES.NOT_FOUND });
    expect(handleUnauthorizedError()).toMatchObject({ code: API_ERROR_CODES.UNAUTHORIZED });
    expect(handleForbiddenError()).toMatchObject({ code: API_ERROR_CODES.AUTH_FORBIDDEN });
    expect(handleConflictError()).toMatchObject({ code: API_ERROR_CODES.CONFLICT });
  });
});
