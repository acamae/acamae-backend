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
    throw createError({
      message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
      code: error.code || API_ERROR_CODES.AUTH_TOKEN_INVALID,
      status: HTTP_STATUS.UNAUTHORIZED,
      errorDetails: {
        type: 'business',
        details: [{ field: 'token', code: 'INVALID', message: 'Invalid token' }],
      },
    });
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
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
        code: API_ERROR_CODES.UNAUTHORIZED,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [{ field: 'token', code: 'UNAUTHORIZED', message: 'Unauthorized' }],
        },
      });
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        code: API_ERROR_CODES.AUTH_TOKEN_INVALID,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [{ field: 'token', code: 'INVALID', message: 'Invalid token' }],
        },
      });
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
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [{ field: 'user', code: 'NOT_FOUND', message: 'User not found' }],
        },
      });
    }

    if (!user.isVerified) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
        code: API_ERROR_CODES.UNAUTHORIZED,
        status: HTTP_STATUS.UNAUTHORIZED,
        errorDetails: {
          type: 'business',
          details: [{ field: 'user', code: 'UNAUTHORIZED', message: 'Unauthorized' }],
        },
      });
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
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
          code: API_ERROR_CODES.UNAUTHORIZED,
          status: HTTP_STATUS.UNAUTHORIZED,
          errorDetails: {
            type: 'business',
            details: [{ field: 'user', code: 'UNAUTHORIZED', message: 'Unauthorized' }],
          },
        });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_FORBIDDEN],
          code: API_ERROR_CODES.AUTH_FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN,
          errorDetails: {
            type: 'business',
            details: [{ field: 'user', code: 'FORBIDDEN', message: 'Forbidden' }],
          },
        });
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
