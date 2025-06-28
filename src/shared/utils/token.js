import jwt from 'jsonwebtoken';

import { config } from '../../infrastructure/config/environment.js';
import { API_ERROR_CODES, ERROR_MESSAGES } from '../constants/apiCodes.js';

import { createError } from './error.js';

/**
 * Token service
 */
export class TokenService {
  constructor(
    secret = config.jwt.secret,
    refreshSecret = config.jwt.refreshSecret,
    accessExpiresIn = config.jwt.expiresIn,
    refreshExpiresIn = config.jwt.refreshExpiresIn
  ) {
    this.secret = secret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn = accessExpiresIn;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  /**
   * Generate an access token
   * @param {Object} payload
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, this.secret, {
        expiresIn: this.accessExpiresIn,
        algorithm: 'HS256',
      });
    } catch (_err) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }
  }

  /**
   * Generate a refresh token
   * @param {Object} payload
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, this.refreshSecret, {
        expiresIn: this.refreshExpiresIn,
        algorithm: 'HS256',
      });
    } catch (_err) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} payload
   * @returns {{accessToken: string, refreshToken: string}}
   */
  generateTokens(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify an access token
   * @param {string} token
   * @returns {Object} Decoded payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (_err) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_TOKEN_INVALID],
        API_ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }
  }

  /**
   * Verify a refresh token
   * @param {string} token
   * @returns {Object} Decoded payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (_err) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
        API_ERROR_CODES.INVALID_REFRESH_TOKEN
      );
    }
  }
}
