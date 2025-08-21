import { createError } from '../../shared/utils/error.js';

/**
 * @typedef {Object} Profile
 * @property {string} id - Unique profile ID
 * @property {string} userId - User ID
 * @property {string} countryCode - Country code
 * @property {string} timezone - Timezone
 * @property {string} bio - Bio
 * @property {string} discordId - Discord ID
 * @property {string} riotId - Riot ID
 * @property {string} profileImageFilename - Profile image filename
 * @property {boolean} isActive - Whether the profile is active
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * Profile entity
 * @class
 */
export class Profile {
  /**
   * Create a new Profile instance
   * @param {Object} data - Profile data
   * @param {string} data.id - Unique profile ID
   * @param {string} data.userId - User ID
   * @param {string} data.countryCode - Country code
   * @param {string} data.timezone - Timezone
   * @param {string} data.bio - Bio
   * @param {string} data.discordId - Discord ID
   * @param {string} data.riotId - Riot ID
   * @param {string} data.profileImageFilename - Profile image filename
   * @param {boolean} data.isActive - Whether the profile is active
   * @param {Date} data.createdAt - Creation date
   * @param {Date} data.updatedAt - Last update date
   */
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.countryCode = data.countryCode;
    this.timezone = data.timezone;
    this.bio = data.bio;
    this.discordId = data.discordId;
    this.riotId = data.riotId;
    this.profileImageFilename = data.profileImageFilename;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    this.validate();
  }

  validate() {
    if (!this.userId) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
        code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        status: HTTP_STATUS.BAD_REQUEST,
        errorDetails: {
          type: 'business',
          details: [{ field: 'userId', code: 'REQUIRED' }],
        },
      });
    }
  }

  /**
   * Get profile's country code
   * @returns {string} Country code
   */
  getCountryCode() {
    return this.countryCode;
  }

  /**
   * Convert profile to plain object
   * @returns {Object} Plain object
   */
  toJSON(includeSensitive = false) {
    const obj = {
      id: this.id,
      userId: this.userId,
      countryCode: this.countryCode,
      timezone: this.timezone,
      bio: this.bio,
      discordId: this.discordId,
      riotId: this.riotId,
      profileImageFilename: this.profileImageFilename,
      isActive: this.isActive,
    };

    if (includeSensitive) {
      obj.createdAt = this.createdAt;
      obj.updatedAt = this.updatedAt;
    }

    return obj;
  }
}
