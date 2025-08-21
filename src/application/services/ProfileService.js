import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Profile service
 * Handles profile-related business logic
 *
 * @param {import('../../domain/repositories/ProfileRepository').ProfileRepository} profileRepository
 */
export class ProfileService {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  /**
   * Get public profile for a user (no sensitive data)
   * @param {string} id
   */
  async getUserProfile(id) {
    let profile = await this.profileRepository.findById(id);
    // Fallback: if not found, try by userId (compatibility for clients using user id)
    if (!profile) {
      const byUser = await this.profileRepository.findByUserId?.(id);
      if (byUser) {
        profile = byUser;
      }
    }
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const { ...safeProfile } = profile;
    const profileId = safeProfile.id ?? id;
    const [games, timezone, rawCountry, availability] = await Promise.all([
      this.profileRepository.findUserGames(profileId),
      this.profileRepository.getUserTimezone?.(profileId),
      this.profileRepository.getUserCountry?.(profileId),
      this.profileRepository.getUserAvailability?.(profileId),
    ]);

    let country = rawCountry;
    if (rawCountry && typeof rawCountry.toJSON === 'function') {
      country = rawCountry.toJSON();
    }

    return { user: safeProfile, games, timezone, availability: availability || [], country };
  }

  /**
   * Get user country
   * @param {string} id - User Profile ID
   */
  async getUserCountry(id) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const country = await this.profileRepository.getUserCountry(id);
    return { country: country || undefined, profileIsActive: !!country };
  }

  /**
   * Set user country
   * @param {string} id - User Profile ID
   * @param {string} countryCode
   */
  async setUserCountry(id, countryCode) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    await this.profileRepository.setUserCountry(id, countryCode);
    const isActive = await this.profileRepository.recalculateActive?.(id);
    return { country: countryCode, profileIsActive: !!isActive };
  }

  /**
   * Get user availability windows
   * @param {string} id - User Profile ID
   */
  async getAvailability(id) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const [timezone, availability] = await Promise.all([
      this.profileRepository.getUserTimezone?.(id),
      this.profileRepository.getUserAvailability?.(id),
    ]);
    return { timezone: timezone || null, availability: availability || [] };
  }

  /**
   * Replace user availability (idempotent)
   * @param {string} id - User Profile ID
   * @param {{ timezone?: string, windows: Array<{dayOfWeek:number,start:string,end:string}> }} payload
   */
  async replaceAvailability(id, payload) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const timezone = payload?.timezone;
    const windows = Array.isArray(payload?.windows) ? payload.windows : [];

    // Validate windows (basic rules per RFC): HH:mm, start<end, 0..6, no overlap per day
    const toMinutes = (hhmm) => {
      const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
      return h * 60 + m;
    };
    const normalizedByDay = new Map();
    for (const w of windows) {
      const day = w.dayOfWeek;
      const startMin = toMinutes(w.start);
      let endMin = toMinutes(w.end);
      if (endMin === 0) endMin = 1440; // 00:00 means end of day
      if (!(day >= 0 && day <= 6)) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR],
          code: API_ERROR_CODES.VALIDATION_ERROR,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: {
            type: 'validation',
            details: [
              {
                field: 'dayOfWeek',
                code: 'OUT_OF_RANGE',
                message: 'dayOfWeek must be between 0 and 6',
              },
            ],
          },
        });
      }
      if (!(startMin < endMin)) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR],
          code: API_ERROR_CODES.VALIDATION_ERROR,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: {
            type: 'validation',
            details: [
              { field: 'time', code: 'INVALID_RANGE', message: 'start must be before end' },
            ],
          },
        });
      }
      if (!normalizedByDay.has(day)) normalizedByDay.set(day, []);
      normalizedByDay.get(day).push({ dayOfWeek: day, startMinute: startMin, endMinute: endMin });
    }
    // Check overlap per day
    for (const [day, arr] of normalizedByDay.entries()) {
      arr.sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1];
        const curr = arr[i];
        if (curr.startMinute < prev.endMinute) {
          throw createError({
            message: ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR],
            code: API_ERROR_CODES.VALIDATION_ERROR,
            status: HTTP_STATUS.BAD_REQUEST,
            errorDetails: {
              type: 'validation',
              details: [
                {
                  field: `windows[${i}]`,
                  code: 'OVERLAP',
                  message: 'Overlaps with another window for the same day',
                },
              ],
            },
          });
        }
      }
    }

    // Persist timezone if provided
    if (timezone) {
      await this.profileRepository.setUserTimezone(id, timezone);
    }
    // Replace windows transactionally
    if (this.profileRepository.replaceUserAvailability) {
      const flattened = Array.from(normalizedByDay.values()).flat();
      await this.profileRepository.replaceUserAvailability(id, flattened);
    }
    const [tz, currentWindows] = await Promise.all([
      this.profileRepository.getUserTimezone?.(id),
      this.profileRepository.getUserAvailability?.(id),
    ]);
    return { timezone: tz || null, availability: currentWindows || [] };
  }

  /**
   * Add a game to the user (idempotent)
   * @param {string} id - User Profile ID
   * @param {number} gameId
   */
  async addGame(id, gameId) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const isActive = await this.profileRepository.addGame(id, gameId);
    return { gameId: Number(gameId), selected: true, profileIsActive: isActive };
  }

  /**
   * Remove a game from the user (idempotent)
   * @param {string} id - User Profile ID
   * @param {number} gameId
   */
  async removeGame(id, gameId) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const isActive = await this.profileRepository.removeGame(id, gameId);
    return { gameId: Number(gameId), selected: false, profileIsActive: isActive };
  }

  /**
   * Get user timezone
   * @param {string} id - User Profile ID
   */
  async getUserTimezone(id) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const timezone = await this.profileRepository.getUserTimezone(id);
    return { timezone: timezone || undefined, profileIsActive: !!timezone };
  }

  /**
   * Set user timezone
   * @param {string} id - User Profile ID
   * @param {string} timezone
   */
  async setUserTimezone(id, timezone) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'profile', code: 'NOT_FOUND' }] },
      });
    }
    const isActive = await this.profileRepository.setUserTimezone(id, timezone);
    return { timezone, profileIsActive: isActive };
  }
}
