import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';
import { TokenService } from '../../shared/utils/token.js';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';

const tokenService = new TokenService();
const userRepository = new PrismaUserRepository();

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
const verifyAccessToken = (token) => {
  try {
    return tokenService.verifyAccessToken(token);
  } catch (error) {
    throw createError(
      ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
      error.code || API_ERROR_CODES.AUTH_TOKEN_INVALID,
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};

/**
 * Authentication middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
        API_ERROR_CODES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const decoded = verifyAccessToken(token);

    const user = await userRepository.findByIdWithFields(decoded.userId, [
      'id',
      'email',
      'username',
      'role',
      'isVerified',
    ]);

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        API_ERROR_CODES.AUTH_USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!user.isVerified) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
        API_ERROR_CODES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Allowed roles
 * @returns {import('express').RequestHandler} Express middleware
 */
export const authorize = (roles = []) => {
  return (req, _res, next) => {
    try {
      if (!req.user) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
          API_ERROR_CODES.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (roles.length && !roles.includes(req.user.role)) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_FORBIDDEN],
          API_ERROR_CODES.AUTH_FORBIDDEN,
          HTTP_STATUS.AUTH_FORBIDDEN
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin role middleware
 * @returns {import('express').RequestHandler} Express middleware
 */
export const isAdmin = () => {
  return authorize(['admin']);
};

/**
 * Manager or Admin role middleware
 * @returns {import('express').RequestHandler} Express middleware
 */
export const isManagerOrAdmin = () => {
  return authorize(['admin', 'manager']);
};
