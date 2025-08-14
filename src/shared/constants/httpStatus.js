/**
 * HTTP Status Codes
 * Centralized definition of all HTTP status codes used in the application
 */
export const HTTP_STATUS = {
  // Success codes
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  AUTH_FORBIDDEN: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,

  // Server error codes
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
