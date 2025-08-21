import { PrismaClient } from '@prisma/client';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Implementation of the profile repository using Prisma
 * @implements {import('../../domain/repositories/ProfileRepository').ProfileRepository}
 */
export class PrismaProfileRepository {
  /** @type {PrismaClient} */
  #prisma;

  constructor() {
    this.#prisma = new PrismaClient();
  }

  /**
   * Convert a Prisma model to a domain entity
   * @param {any} prismaProfile
   * @returns {import('../../domain/entities/Profile').Profile|null}
   */
  #toDomainModel(prismaProfile) {
    if (!prismaProfile) return null;

    return {
      id: prismaProfile.id != null ? prismaProfile.id.toString() : undefined,
      userId: prismaProfile.user_id != null ? prismaProfile.user_id.toString() : undefined,
      countryCode: prismaProfile.country_code,
      timezone: prismaProfile.timezone,
      bio: prismaProfile.bio,
      discordId: prismaProfile.discord_id,
      riotId: prismaProfile.riot_id,
      profileImageFilename: prismaProfile.profile_image_filename,
      isActive: prismaProfile.is_active,
      createdAt: prismaProfile.created_at,
      updatedAt: prismaProfile.updated_at,
    };
  }

  /**
   * Recalculate profile's active status and recalc is_active
   * @param {string} userId
   * @returns {Promise<boolean>} New is_active value
   */
  async #recalculateUserProfileActive(profileId) {
    const [profile, gamesCount] = await Promise.all([
      this.#prisma.userProfile.findUnique({
        where: { id: parseInt(profileId) },
        select: { country_code: true, timezone: true },
      }),
      this.#prisma.gameProfile.count({ where: { profile_id: parseInt(profileId) } }),
    ]);
    const active = Boolean(profile?.country_code) && Boolean(profile?.timezone) && gamesCount > 0;
    await this.setActive(profileId, active);
    return active;
  }

  /**
   * Find all profiles
   * @param {Object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=10]
   * @param {Object} [options.filters={}]
   * @returns {Promise<import('../../domain/entities/Profile').Profile[]>}
   */
  async findAll({ page = 1, limit = 10, filters = {} } = {}) {
    const profiles = await this.#prisma.userProfile.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: filters,
    });
    return profiles
      .map((profile) => {
        const mapped = this.#toDomainModel(profile);
        return mapped;
      })
      .filter(Boolean);
  }

  /**
   * Find a profile by its ID
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/Profile').Profile|null>}
   */
  async findById(id) {
    const profile = await this.#prisma.userProfile.findUnique({
      where: { id: parseInt(id) },
    });
    if (!profile) return null;
    const mapped = this.#toDomainModel(profile);
    return mapped;
  }

  /**
   * Find a profile by its username
   * @param {string} username
   * @returns {Promise<import('../../domain/entities/Profile').Profile|null>}
   */
  async findByUserId(userId) {
    const profile = await this.#prisma.userProfile.findUnique({
      where: { user_id: parseInt(userId) },
    });
    if (!profile) return null;
    const mapped = this.#toDomainModel(profile);
    return mapped;
  }

  /**
   * Create a new profile
   * @param {CreateProfileDto} profileData
   * @returns {Promise<import('../../domain/entities/Profile').Profile>}
   */
  async create(profileData) {
    try {
      const profile = await this.#prisma.userProfile.create({
        data: {
          user_id: parseInt(profileData.userId),
          country_code: profileData.countryCode,
          timezone: profileData.timezone,
          bio: profileData.bio,
          discord_id: profileData.discordId,
          riot_id: profileData.riotId,
          profile_image_filename: profileData.profileImageFilename,
          is_active: profileData.isActive,
        },
      });

      return this.#toDomainModel(profile);
    } catch (error) {
      if (error.code === 'P2002') {
        throw createError({
          message: 'Profile already exists',
          code: API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [{ field: 'profile', code: 'P2002', message: 'Profile already exists' }],
          },
        });
      }
    }
  }

  /**
   * Update an existing user
   * @param {string} id
   * @param {UpdateUserDto} userData
   * @returns {Promise<import('../../domain/entities/User').User>}
   */
  async update(id, profileData) {
    const data = {
      country_code: profileData.countryCode,
      timezone: profileData.timezone,
      bio: profileData.bio,
      discord_id: profileData.discordId,
      riot_id: profileData.riotId,
      profile_image_filename: profileData.profileImageFilename,
      is_active: profileData.isActive,
    };

    const profile = await this.#prisma.userProfile.update({
      where: { id: parseInt(id) },
      data,
    });

    return this.#toDomainModel(profile);
  }

  /**
   * Delete a profile
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.#prisma.userProfile.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Set the verification status of a profile
   * @param {string} id
   * @param {boolean} isActive
   * @returns {Promise<import('../../domain/entities/Profile').Profile>}
   */
  async setActive(id, isActive) {
    await this.#prisma.userProfile.update({
      where: { id: parseInt(id) },
      data: {
        is_active: isActive,
      },
    });
    // Fetch full profile to ensure all fields (including user_id) are present for mapping
    const full = await this.#prisma.userProfile.findUnique({ where: { id: parseInt(id) } });
    return this.#toDomainModel(full);
  }

  /**
   * Recalculate profile's active status and recalc is_active
   * @param {string} userId
   * @returns {Promise<boolean>} New is_active value
   */
  async recalculateActive(profileId) {
    const [profile, gamesCount] = await Promise.all([
      this.#prisma.userProfile.findUnique({
        where: { id: parseInt(profileId) },
        select: { country_code: true, timezone: true },
      }),
      this.#prisma.gameProfile.count({ where: { profile_id: parseInt(profileId) } }),
    ]);
    const active = Boolean(profile?.country_code) && Boolean(profile?.timezone) && gamesCount > 0;
    await this.setActive(profileId, active);
    return active;
  }

  /**
   * Find a user by ID with specific fields only (optimized for auth middleware)
   * @param {string} id - User ID
   * @param {string[]} fields - Fields to select (domain model field names)
   * @returns {Promise<Partial<import('../../domain/entities/User').User>|null>}
   */
  async findByIdWithFields(id, fields = []) {
    // Mapear nombres de campos del dominio a nombres de la base de datos
    const fieldMap = {
      id: 'id',
      userId: 'user_id',
      countryCode: 'country_code',
      timezone: 'timezone',
      bio: 'bio',
      discordId: 'discord_id',
      riotId: 'riot_id',
      profileImageFilename: 'profile_image_filename',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };

    // Crear objeto select basado en los campos solicitados
    const select = {};
    if (fields.length > 0) {
      fields.forEach((field) => {
        if (fieldMap[field]) {
          select[fieldMap[field]] = true;
        }
      });
    } else {
      // If no fields specified, select basic fields for auth
      select.id = true;
      select.user_id = true;
      select.country_code = true;
      select.timezone = true;
      select.bio = true;
      select.discord_id = true;
      select.riot_id = true;
      select.profile_image_filename = true;
      select.is_active = true;
    }

    const profile = await this.#prisma.userProfile.findUnique({
      where: { id: parseInt(id) },
      select,
    });

    if (!profile) return null;
    const mapped = this.#toDomainModel(profile);
    return mapped;
  }

  /**
   * Get user's timezone from profile
   * @param {string} userId
   * @returns {Promise<string|undefined>}
   */
  async getUserTimezone(profileId) {
    const profile = await this.#prisma.userProfile.findUnique({
      where: { id: parseInt(profileId) },
      select: { timezone: true },
    });
    return profile?.timezone || undefined;
  }

  /**
   * Set user's timezone
   * @param {string} userId
   * @param {string} timezone
   * @returns {Promise<boolean>} New is_active value
   */
  async setUserTimezone(profileId, timezone) {
    await this.#prisma.userProfile.update({
      where: { id: parseInt(profileId) },
      data: { timezone },
    });
    return await this.#recalculateUserProfileActive(profileId);
  }

  /**
   * Add a game to the user's profile
   * @param {string} userId
   * @param {string} gameId
   * @returns {Promise<boolean>} New is_active value
   */
  async addGame(profileId, gameId) {
    await this.#prisma.gameProfile.upsert({
      where: {
        profile_id_game_id: {
          profile_id: parseInt(profileId),
          game_id: parseInt(gameId),
        },
      },
      update: {},
      create: { profile_id: parseInt(profileId), game_id: parseInt(gameId) },
    });
    return await this.#recalculateUserProfileActive(profileId);
  }

  /**
   * Remove a game from the user's profile
   * @param {string} userId
   * @param {string} gameId
   * @returns {Promise<boolean>} New is_active value
   */
  async removeGame(profileId, gameId) {
    try {
      const gp = await this.#prisma.gameProfile.findFirst({
        where: { profile_id: parseInt(profileId), game_id: parseInt(gameId) },
        select: { id: true },
      });
      if (gp) {
        await this.#prisma.gameProfile.delete({ where: { id: gp.id } });
      }
    } finally {
      // Always recalc regardless of deletion outcome
      return await this.#recalculateUserProfileActive(profileId);
    }
  }

  /**
   * List selected games for a user by joining game_profiles → games
   * @param {string} userId
   * @returns {Promise<import('../../domain/entities/Game').Game[]>}
   */
  async findUserGames(profileId) {
    const list = await this.#prisma.gameProfile.findMany({
      where: { profile_id: parseInt(profileId) },
      select: {
        game: { select: { id: true, code: true, name_code: true, image_filename: true } },
      },
      orderBy: { game_id: 'asc' },
    });
    return list.map((row) => ({
      id: row.game.id,
      code: row.game.code,
      nameCode: row.game.name_code,
      imageFilename: row.game.image_filename || undefined,
    }));
  }

  /**
   * Get user country from profile
   * @param {string} userId
   * @returns {Promise<string|undefined>}
   */
  async getUserCountry(profileId) {
    const profile = await this.#prisma.userProfile.findUnique({
      where: { id: parseInt(profileId) },
      select: { country_code: true },
    });
    return profile?.country_code || undefined;
  }

  /**
   * Set user's country
   * @param {string} userId
   * @param {string} countryCode
   * @returns {Promise<string|undefined>}
   */
  async setUserCountry(profileId, countryCode) {
    const profile = await this.#prisma.userProfile.update({
      where: { id: parseInt(profileId) },
      data: { country_code: countryCode },
    });
    return profile?.country_code || undefined;
  }

  // Availability: replace transactionally
  async replaceUserAvailability(profileId, windows) {
    // If availability model is not present (no migration yet), no-op gracefully
    if (!this.#prisma || !this.#prisma.availabilityWindow) {
      return;
    }
    return await this.#prisma.$transaction(async (tx) => {
      if (!tx.availabilityWindow) return; // extra guard
      await tx.availabilityWindow.deleteMany({ where: { profile_id: parseInt(profileId) } });
      if (Array.isArray(windows) && windows.length > 0) {
        await tx.availabilityWindow.createMany({
          data: windows.map((w) => ({
            profile_id: parseInt(profileId),
            day_of_week: w.dayOfWeek ?? w.day_of_week,
            start_minute: w.startMinute ?? w.start_minute,
            end_minute: w.endMinute ?? w.end_minute,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async getUserAvailability(profileId) {
    if (!this.#prisma || !this.#prisma.availabilityWindow) {
      return [];
    }
    const list = await this.#prisma.availabilityWindow.findMany({
      where: { profile_id: parseInt(profileId) },
      orderBy: [{ day_of_week: 'asc' }, { start_minute: 'asc' }],
      select: { day_of_week: true, start_minute: true, end_minute: true },
    });
    const toHhmm = (min) =>
      `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    return list.map((row) => ({
      dayOfWeek: row.day_of_week,
      start: toHhmm(row.start_minute),
      end: row.end_minute === 1440 ? '00:00' : toHhmm(row.end_minute),
    }));
  }
}
