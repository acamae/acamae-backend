import { z } from 'zod';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import {
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_EMAIL_LENGTH,
  MIN_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MIN_TEAM_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MIN_TEAM_TAG_LENGTH,
  MAX_TEAM_TAG_LENGTH,
  MAX_TEAM_DESCRIPTION_LENGTH,
  REGEX,
  ERROR_MESSAGES,
  USER_ROLES,
} from '../../shared/constants/validation.js';
import { sanitizeEmail, sanitizeNumber, sanitizeString } from '../../shared/utils/sanitize.js';

import { throwError } from './errorHandler.js';

/**
 * Validation schemas for different routes
 * These schemas define the expected structure and types of request data
 */
export const validationSchemas = {
  // Auth routes
  login: z.object({
    email: z
      .string()
      .min(MIN_EMAIL_LENGTH, ERROR_MESSAGES.EMAIL_LENGTH)
      .max(MAX_EMAIL_LENGTH, ERROR_MESSAGES.EMAIL_LENGTH)
      .email(ERROR_MESSAGES.INVALID_EMAIL)
      .transform(sanitizeEmail),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, ERROR_MESSAGES.PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH, ERROR_MESSAGES.PASSWORD_LENGTH),
  }),

  register: z.object({
    email: z
      .string()
      .min(MIN_EMAIL_LENGTH, ERROR_MESSAGES.EMAIL_LENGTH)
      .max(MAX_EMAIL_LENGTH, ERROR_MESSAGES.EMAIL_LENGTH)
      .email(ERROR_MESSAGES.INVALID_EMAIL)
      .transform(sanitizeEmail),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, ERROR_MESSAGES.PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH, ERROR_MESSAGES.PASSWORD_LENGTH)
      .regex(REGEX.PASSWORD, ERROR_MESSAGES.INVALID_PASSWORD),
    username: z
      .string()
      .min(MIN_USERNAME_LENGTH, ERROR_MESSAGES.USERNAME_LENGTH)
      .max(MAX_USERNAME_LENGTH, ERROR_MESSAGES.USERNAME_LENGTH)
      .regex(REGEX.USERNAME, ERROR_MESSAGES.INVALID_USERNAME)
      .transform(sanitizeString),
    firstName: z
      .string()
      .max(MAX_NAME_LENGTH, ERROR_MESSAGES.NAME_LENGTH)
      .regex(REGEX.NAME, ERROR_MESSAGES.INVALID_NAME)
      .transform(sanitizeString)
      .optional(),
    lastName: z
      .string()
      .max(MAX_NAME_LENGTH, ERROR_MESSAGES.NAME_LENGTH)
      .regex(REGEX.NAME, ERROR_MESSAGES.INVALID_NAME)
      .transform(sanitizeString)
      .optional(),
  }),

  logout: z.object({
    refreshToken: z.string().min(1, ERROR_MESSAGES.INVALID_TOKEN),
  }),

  // User routes
  updateUser: z.object({
    firstName: z
      .string()
      .max(MAX_NAME_LENGTH, ERROR_MESSAGES.NAME_LENGTH)
      .regex(REGEX.NAME, ERROR_MESSAGES.INVALID_NAME)
      .transform(sanitizeString)
      .optional(),
    lastName: z
      .string()
      .max(MAX_NAME_LENGTH, ERROR_MESSAGES.NAME_LENGTH)
      .regex(REGEX.NAME, ERROR_MESSAGES.INVALID_NAME)
      .transform(sanitizeString)
      .optional(),
    email: z
      .string()
      .min(MIN_EMAIL_LENGTH, ERROR_MESSAGES.EMAIL_LENGTH)
      .max(MAX_EMAIL_LENGTH, ERROR_MESSAGES.EMAIL_LENGTH)
      .email(ERROR_MESSAGES.INVALID_EMAIL)
      .transform(sanitizeEmail)
      .optional(),
    role: z
      .enum([USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.MANAGER], {
        errorMap: () => ({ message: ERROR_MESSAGES.INVALID_ROLE }),
      })
      .optional(),
  }),

  // Team routes
  createTeam: z.object({
    name: z
      .string()
      .min(MIN_TEAM_NAME_LENGTH, ERROR_MESSAGES.TEAM_NAME_LENGTH)
      .max(MAX_TEAM_NAME_LENGTH, ERROR_MESSAGES.TEAM_NAME_LENGTH)
      .transform(sanitizeString),
    tag: z
      .string()
      .min(MIN_TEAM_TAG_LENGTH, ERROR_MESSAGES.TEAM_TAG_LENGTH)
      .max(MAX_TEAM_TAG_LENGTH, ERROR_MESSAGES.TEAM_TAG_LENGTH)
      .regex(REGEX.TEAM_TAG, ERROR_MESSAGES.TEAM_TAG_FORMAT),
    description: z
      .string()
      .max(MAX_TEAM_DESCRIPTION_LENGTH, ERROR_MESSAGES.TEAM_DESCRIPTION_LENGTH)
      .transform(sanitizeString)
      .optional(),
  }),

  // Pagination
  pagination: z.object({
    page: z.string().transform(sanitizeNumber).optional(),
    limit: z.string().transform(sanitizeNumber).optional(),
  }),

  // ID validation
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

/**
 * Validation middleware
 * This middleware validates and sanitizes request data before it reaches the route handlers
 * @param {string} schemaName - The name of the schema to validate
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateRequest = (schemaName) => {
  return (req, _res, next) => {
    try {
      const schema = validationSchemas[schemaName];
      if (!schema) {
        throwError(
          ERROR_MESSAGES[API_ERROR_CODES.INVALID_SCHEMA],
          API_ERROR_CODES.INVALID_SCHEMA,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Validate and sanitize request body
      const validatedData = schema.parse(req.body);

      // Replace request body with validated and sanitized data
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors in a clear way
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throwError(
          ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR],
          API_ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
          validationErrors
        );
      }
      next(error);
    }
  };
};

/**
 * Validation rules for user registration
 */
export const registerValidation = validateRequest('register');

/**
 * Validation rules for user login
 */
export const loginValidation = validateRequest('login');

/**
 * Validation rules for user logout
 */
export const logoutValidation = validateRequest('logout');

/**
 * Validation rules for team creation
 */
export const teamValidation = validateRequest('createTeam');

/**
 * Validation rules for user update
 */
export const updateUserValidation = validateRequest('updateUser');

/**
 * Validation rules for pagination
 */
export const paginationValidation = validateRequest('pagination');

/**
 * Validation rules for ID parameters
 */
export const idValidation = validateRequest('id');

/**
 * Sanitization middleware for query parameters
 * This middleware sanitizes query parameters to prevent XSS and injection attacks
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const sanitizeQueryParams = (req, _res, next) => {
  try {
    // Sanitize all string query parameters
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Sanitize request data
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const sanitizeInput = (req, _res, next) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
        }
      });
    }

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error sanitizing input:', error);
    next(error);
  }
};
