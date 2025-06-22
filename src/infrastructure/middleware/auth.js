import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';
import { config } from '../config/environment.js';

const prisma = new PrismaClient();

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw createError('Token expired', API_ERROR_CODES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
    }
    throw createError('Invalid token', API_ERROR_CODES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
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
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_TOKEN],
        API_ERROR_CODES.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.USER_NOT_FOUND],
        API_ERROR_CODES.USER_NOT_FOUND,
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
          ERROR_MESSAGES[API_ERROR_CODES.FORBIDDEN],
          API_ERROR_CODES.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verify email middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const verifyEmail = async (req, _res, next) => {
  try {
    const { token } = req.params;

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_TOKEN],
        API_ERROR_CODES.INVALID_TOKEN,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.TOKEN_EXPIRED],
        API_ERROR_CODES.TOKEN_EXPIRED,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    req.verificationToken = verificationToken;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify password reset token middleware
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const verifyPasswordResetToken = async (req, _res, next) => {
  try {
    const { token } = req.params;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_TOKEN],
        API_ERROR_CODES.INVALID_TOKEN,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (resetToken.expiresAt < new Date()) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.TOKEN_EXPIRED],
        API_ERROR_CODES.TOKEN_EXPIRED,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    req.resetToken = resetToken;
    next();
  } catch (error) {
    next(error);
  }
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
