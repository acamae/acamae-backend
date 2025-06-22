import { ERROR_MESSAGES } from './apiCodes.js';
import { ROLES } from './roles.js';

/**
 * Validation constants
 */
export const MIN_USERNAME_LENGTH = parseInt(process.env.USERNAME_MIN_LENGTH || '3', 10);
export const MAX_USERNAME_LENGTH = parseInt(process.env.USERNAME_MAX_LENGTH || '50', 10);
export const MIN_PASSWORD_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10);
export const MAX_PASSWORD_LENGTH = parseInt(process.env.PASSWORD_MAX_LENGTH || '100', 10);
export const MIN_EMAIL_LENGTH = 5;
export const MAX_EMAIL_LENGTH = 100;
export const MAX_NAME_LENGTH = 50;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Team validation constants
export const MIN_TEAM_NAME_LENGTH = 2;
export const MAX_TEAM_NAME_LENGTH = 100;
export const MIN_TEAM_TAG_LENGTH = 2;
export const MAX_TEAM_TAG_LENGTH = 16;
export const MAX_TEAM_DESCRIPTION_LENGTH = 500;

/**
 * Regular expressions
 */
export const REGEX = {
  EMAIL: /^[^\s@.]+(?:\.[^\s@.]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  PASSWORD: new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{${MIN_PASSWORD_LENGTH},}$`),
  TEAM_TAG: /^[A-Z0-9]+$/,
  NAME: /^[a-zA-ZÀ-ÿ\s'-]+$/,
};

/**
 * User roles
 */
export const USER_ROLES = {
  USER: ROLES.USER.name,
  ADMIN: ROLES.ADMIN.name,
  MANAGER: ROLES.MANAGER.name,
};

// Re-export error messages for backward compatibility
export { ERROR_MESSAGES };
