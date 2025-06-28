// Desactivar el mock global definido en jest.setup.js
jest.unmock(require.resolve('../../../src/infrastructure/middleware/compression.js'));

import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

const {
  compressionErrorHandler,
} = require('../../../src/infrastructure/middleware/compression.js');

describe('compressionErrorHandler middleware', () => {
  it('transforms entity.too.large error', () => {
    const err = { type: 'entity.too.large' };
    const next = jest.fn();

    // Call middleware
    compressionErrorHandler(err, {}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const transformed = next.mock.calls[0][0];

    expect(transformed.code).toBe(API_ERROR_CODES.REQUEST_TOO_LARGE);
    expect(transformed.status).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE);
  });

  it('passes through other errors untouched', () => {
    const otherError = new Error('Some other');
    const next = jest.fn();

    compressionErrorHandler(otherError, {}, {}, next);

    expect(next).toHaveBeenCalledWith(otherError);
  });
});
