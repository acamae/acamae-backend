import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware para agregar requestId único a cada request
 * Genera un UUID v4 o usa el X-Request-ID header si está presente
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const requestIdMiddleware = (req, res, next) => {
  try {
    // Usar el header X-Request-ID si está presente, o generar uno nuevo
    req.requestId = req.headers['x-request-id'] || uuidv4();

    // Agregar el requestId al header de respuesta para trazabilidad
    res.setHeader('X-Request-ID', req.requestId);

    next();
  } catch (error) {
    // En caso de error generando UUID, usar timestamp + random
    console.error('Error generating requestId:', error);
    req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
  }
};
