import { API_ERROR_CODES, ERROR_MESSAGES } from '../constants/apiCodes.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * @typedef {object} Details
 * @property {string} field - Campo del error
 * @property {string} code - Código del error
 * @property {string} message - Mensaje del error
 */
/**
 * @typedef {Object} ErrorDetails
 * @property {string} type - Tipo de error
 * @property {Array<Details>} details - Detalles adicionales del error
 */
/**
 * Create an error object with API error code
 * @param {Object} options - Error options
 * @param {string} options.message - Error message
 * @param {string} [options.code] - API error code
 * @param {number} [options.status] - HTTP status code
 * @param {string} [options.timestamp] - Timestamp of the error
 * @param {string} [options.requestId] - Request ID of the error
 * @param {boolean} [options.success] - Whether the request was successful
 * @param {object} [options.data] - Data of the error
 * @param {ErrorDetails} [options.errorDetails] - Additional error details
 * @returns {Error} Error object with API error code and HTTP status code
 */
export const createError = ({
  message,
  code = API_ERROR_CODES.INTERNAL_SERVER_ERROR,
  status = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  timestamp = new Date().toISOString(),
  requestId = 'unknown',
  success = false,
  data = null,
  errorDetails = null,
} = {}) => {
  const error = new Error(
    message || ERROR_MESSAGES[code] || ERROR_MESSAGES[API_ERROR_CODES.UNEXPECTED_ERROR]
  );
  error.code = code;
  error.status = status;
  error.timestamp = timestamp;
  error.requestId = requestId;
  error.success = success;
  error.data = data;
  if (errorDetails) error.error = errorDetails;
  return error;
};
