import { notFoundHandler } from '../../../src/infrastructure/middleware/errorHandler.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

describe('notFoundHandler middleware', () => {
  function createResMock(req) {
    const res = {};
    res.statusCode = 0;
    res.req = req; // Simula Express: res.req.requestId
    res.status = jest.fn((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn((payload) => {
      res._json = payload;
      return res;
    });
    return res;
  }

  it('should return a 404 error with proper structure and custom requestId', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/nonexistent',
      requestId: 'req-123',
    };
    const res = createResMock(req);

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(res.json).toHaveBeenCalled();
    const response = res._json;
    expect(response).toMatchObject({
      success: false,
      data: null,
      status: HTTP_STATUS.NOT_FOUND,
      code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'The requested endpoint does not exist',
      requestId: 'req-123',
      error: {
        type: 'routing',
        details: [
          {
            field: 'route',
            code: 'ROUTE_NOT_FOUND',
            message: 'The endpoint GET /api/nonexistent is not available',
          },
        ],
      },
    });
    expect(typeof response.timestamp).toBe('string');
  });

  it('should include correct error details for different HTTP methods', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/invalid-endpoint',
      requestId: 'req-456',
    };
    const res = createResMock(req);

    notFoundHandler(req, res);

    const response = res._json;
    expect(response.error.details[0].message).toBe(
      'The endpoint POST /api/invalid-endpoint is not available'
    );
    expect(response.requestId).toBe('req-456');
  });

  it('should use "unknown" as requestId if not present', () => {
    const req = {
      method: 'DELETE',
      originalUrl: '/api/unknown',
      // no requestId
    };
    const res = createResMock(req);

    notFoundHandler(req, res);

    const response = res._json;
    expect(response.requestId).toBe('unknown');
    expect(response.error.details[0].message).toBe(
      'The endpoint DELETE /api/unknown is not available'
    );
  });
});
