import { ERROR_MESSAGES } from './apiCodes.js';
import { ROLES } from './roles.js';

/**
 * Validation constants
 */
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 100;
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
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
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
