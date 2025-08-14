import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * User service
 * Handles user-related business logic
 *
 * @param {import('../../domain/repositories/UserRepository').UserRepository} userRepository
 */
export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Get all users
   * @param {Object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=10]
   * @param {Object} [options.filters={}]
   * @returns {Promise<object[]>}
   */
  async getAllUsers({ page = 1, limit = 10, filters = {} } = {}) {
    const users = await this.userRepository.findAll({ page, limit, filters });

    if (!users) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [{ field: 'database', code: 'DATABASE_ERROR', message: 'Error fetching users' }],
        },
      });
    }
    // Remove sensitive fields
    return users.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Get a single user by id
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'NOT_FOUND',
              message: `User id ${id} not found`,
            },
          ],
        },
      });
    }
    const { passwordHash, ...cleanUser } = user;
    return cleanUser;
  }

  /**
   * Update user
   * @param {string} id
   * @param {object} userData
   * @returns {Promise<object>}
   */
  async updateUser(id, userData) {
    const { email, username } = userData;

    // Check duplicates
    if (email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS],
          code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'email',
                code: 'ALREADY_EXISTS',
                message: 'The email already exists',
              },
            ],
          },
        });
      }
    }
    if (username) {
      const existing = await this.userRepository.findByUsername(username);
      if (existing && existing.id !== id) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS],
          code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'username',
                code: 'ALREADY_EXISTS',
                message: 'The username already exists',
              },
            ],
          },
        });
      }
    }

    const updated = await this.userRepository.update(id, userData);

    if (!updated) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'DATABASE_ERROR',
              message: `Couldn't update user id ${id}`,
            },
          ],
        },
      });
    }

    const { passwordHash, ...cleanUser } = updated;
    return cleanUser;
  }

  /**
   * Delete user
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteUser(id) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'user',
              code: 'NOT_FOUND',
              message: `User id ${id} not found`,
            },
          ],
        },
      });
    }

    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            {
              field: 'database',
              code: 'DATABASE_ERROR',
              message: `Couldn't delete user id ${id}`,
            },
          ],
        },
      });
    }
    return true;
  }

  /**
   * Get public profile for a user (no sensitive data)
   * @param {string} id
   */
  async getPublicProfile(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'user', code: 'NOT_FOUND' }] },
      });
    }
    const { passwordHash, verificationToken, resetToken, ...safeUser } = user;
    const [games, timezoneRaw] = await Promise.all([
      this.userRepository.findUserGames(id),
      this.userRepository.getUserTimezone(id),
    ]);
    const timezone = timezoneRaw ?? null;
    // Availability storage is not yet implemented → return empty list consistently
    const availability = [];
    return { user: safeUser, games, timezone, availability };
  }

  /**
   * Get user availability windows
   * @param {string} id
   */
  async getAvailability(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'user', code: 'NOT_FOUND' }] },
      });
    }
    return { timezone: undefined, availability: [] };
  }

  /**
   * Replace user availability (idempotent)
   * @param {string} id
   * @param {{ timezone?: string, windows: Array<{dayOfWeek:number,start:string,end:string}> }} payload
   */
  async replaceAvailability(id, payload) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'user', code: 'NOT_FOUND' }] },
      });
    }
    const timezone = payload?.timezone;
    let isActive = user.isActive;
    if (timezone) {
      // Persist timezone in user profile and recalc active flag
      isActive = await this.userRepository.setTimezone(id, timezone);
    }
    return { timezone, availability: payload?.windows || [], isActive };
  }

  /**
   * Add a game to the user (idempotent)
   * @param {string} id
   * @param {number} gameId
   */
  async addGame(id, gameId) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'user', code: 'NOT_FOUND' }] },
      });
    }
    const isActive = await this.userRepository.addGame(id, gameId);
    return { gameId: Number(gameId), selected: true, profileIsActive: isActive };
  }

  /**
   * Remove a game from the user (idempotent)
   * @param {string} id
   * @param {number} gameId
   */
  async removeGame(id, gameId) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.RESOURCE_NOT_FOUND],
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: { type: 'business', details: [{ field: 'user', code: 'NOT_FOUND' }] },
      });
    }
    const isActive = await this.userRepository.removeGame(id, gameId);
    return { gameId: Number(gameId), selected: false, profileIsActive: isActive };
  }
}
