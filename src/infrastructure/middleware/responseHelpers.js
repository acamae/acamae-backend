import { API_SUCCESS_CODES } from '../../shared/constants/apiCodes.js';

/**
 * Response helpers para respuestas consistentes de la API
 * Implementa la estructura exacta requerida por el frontend
 */

/**
 * Helper para respuestas exitosas
 * @param {import('express').Response} res - Express response object
 * @param {any} data - Datos a retornar (o null)
 * @param {string} message - Mensaje descriptivo en español
 * @param {object} meta - Metadatos opcionales (paginación, etc.)
 * @returns {import('express').Response} Response object
 */
export const apiSuccess = (res, data = null, message = 'Operación exitosa', meta = null) => {
  const response = {
    success: true,
    data,
    status: res.statusCode,
    code: API_SUCCESS_CODES.SUCCESS,
    message,
    timestamp: new Date().toISOString(),
    requestId: res.req?.requestId || 'unknown',
  };

  if (meta) {
    response.meta = meta;
  }

  return res.json(response);
};

/**
 * Helper para respuestas de error
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - Código HTTP de estado
 * @param {string} code - Código semántico de error
 * @param {string} message - Mensaje de error en español
 * @param {object} errorDetails - Detalles adicionales del error
 * @param {object} meta - Metadatos opcionales
 * @returns {import('express').Response} Response object
 */
export const apiError = (res, statusCode, code, message, errorDetails = null, meta = null) => {
  const response = {
    success: false,
    data: null,
    status: statusCode,
    code,
    message,
    timestamp: new Date().toISOString(),
    requestId: res.req?.requestId || 'unknown',
  };

  if (errorDetails) {
    response.error = errorDetails;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Middleware para agregar helpers a todas las respuestas
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const responseHelpersMiddleware = (req, res, next) => {
  // Agregar helpers a la respuesta
  res.apiSuccess = (data, message, meta) => apiSuccess(res, data, message, meta);
  res.apiError = (statusCode, code, message, errorDetails, meta) =>
    apiError(res, statusCode, code, message, errorDetails, meta);

  next();
};
