import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

const { notFoundHandler } = require('../../../src/infrastructure/middleware/notFoundHandler.js');

describe('notFoundHandler middleware', () => {
  it('calls next with a 404 error', () => {
    const next = jest.fn();

    notFoundHandler({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];

    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(API_ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(err.status).toBe(HTTP_STATUS.NOT_FOUND);
  });
});
