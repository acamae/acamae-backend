import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import {
  MAX_TEAM_DESCRIPTION_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_TAG_LENGTH,
  MIN_TEAM_NAME_LENGTH,
  MIN_TEAM_TAG_LENGTH,
} from '../../shared/constants/validation.js';
import { createError } from '../../shared/utils/error.js';

/**
 * @typedef {Object} Team
 * @property {string} id - Unique team ID
 * @property {string} userId - Owner user ID
 * @property {string} name - Team name
 * @property {string} tag - Team tag
 * @property {string} [logoFilename] - Team logo filename
 * @property {string} [description] - Team description
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 * @property {User} [user] - Owner user
 */

export class Team {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.userId
   * @param {string} data.name
   * @param {string} data.tag
   * @param {string} [data.logoFilename]
   * @param {string} [data.description]
   * @param {Date} data.createdAt
   * @param {Date} data.updatedAt
   * @param {User} [data.user]
   */
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.tag = data.tag;
    this.logoFilename = data.logoFilename;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.user = data.user;
  }

  /**
   * Validate team data
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.name) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
        code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'name',
              code: 'REQUIRED',
              message: 'Team name is required',
            },
          ],
        },
      });
    }

    if (this.name.length < MIN_TEAM_NAME_LENGTH || this.name.length > MAX_TEAM_NAME_LENGTH) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_LENGTH],
        code: API_ERROR_CODES.TEAM_NAME_LENGTH,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'name',
              code: 'LENGTH',
              message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_LENGTH],
            },
          ],
        },
      });
    }

    if (!this.tag) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
        code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'tag',
              code: 'REQUIRED',
              message: 'Team tag is required',
            },
          ],
        },
      });
    }

    if (this.tag.length < MIN_TEAM_TAG_LENGTH || this.tag.length > MAX_TEAM_TAG_LENGTH) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_LENGTH],
        code: API_ERROR_CODES.TEAM_TAG_LENGTH,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'tag',
              code: 'LENGTH',
              message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_LENGTH],
            },
          ],
        },
      });
    }

    if (this.description && this.description.length > MAX_TEAM_DESCRIPTION_LENGTH) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_DESCRIPTION_LENGTH],
        code: API_ERROR_CODES.TEAM_DESCRIPTION_LENGTH,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'description',
              code: 'LENGTH',
              message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_DESCRIPTION_LENGTH],
            },
          ],
        },
      });
    }
  }
}
