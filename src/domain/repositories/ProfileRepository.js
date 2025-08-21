/**
 * @typedef {Object} UserRepository
 * @property {function(string): Promise<Profile|null>} findById - Find a profile by ID
 * @property {function(): Promise<Profile[]>} findAll - Get all profiles
 * @property {function(CreateProfileDto): Promise<Profile>} create - Create a new profile
 * @property {function(string, UpdateProfileDto): Promise<Profile>} update - Update a profile
 * @property {function(string): Promise<boolean>} delete - Delete a profile
 * @property {function(string, string): Promise<boolean>} setUserTimezone - Set timezone on profile and recalc is_active
 * @property {function(string, number): Promise<boolean>} addGame - Add a game to the profile's game profiles and recalc is_active
 * @property {function(string, number): Promise<boolean>} removeGame - Remove a game and recalc is_active
 * @property {function(string): Promise<import('../entities/Game').Game[]>} findUserGames - List selected games for a profile
 * @property {function(string): Promise<string|undefined>} getUserTimezone - Get profile's timezone
 * @property {function(string): Promise<import('../entities/Country').Country>} getUserCountry - Get profile's country
 * @property {function(string, string): Promise<boolean>} setUserCountry - Set profile's country and recalc is_active
 */

/**
 * Interface for profile repository operations
 * @interface
 */
export class ProfileRepository {
  /**
   * Find a profile by ID
   * @param {string} id
   * @returns {Promise<Profile|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }
  /**
   * Create a new profile
   * @param {Profile} profile
   * @returns {Promise<Profile>}
   */
  async create(profile) {
    throw new Error('Method not implemented');
  }
  /**
   * Update a profile
   * @param {string} id
   * @param {Partial<Profile>} data
   * @returns {Promise<Profile>}
   */
  async update(id, data) {
    throw new Error('Method not implemented');
  }
  /**
   * Delete a profile
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
  /**
   * Find a profile by ID with specific fields
   * @param {string} id
   * @param {string[]} fields
   * @returns {Promise<Profile|null>}
   */
  async findByIdWithFields(id, fields = []) {
    throw new Error('Method not implemented');
  }
  /**
   * Get profile's timezone
   * @param {string} userId
   * @returns {Promise<string|undefined>}
   */
  async getUserTimezone(userId) {
    throw new Error('Method not implemented');
  }
  /**
   * Set timezone on profile and recalc is_active
   * @param {string} userId
   * @param {string} timezone
   * @returns {Promise<boolean>} New is_active value
   */
  async setUserTimezone(userId, timezone) {
    throw new Error('Method not implemented');
  }
  /**
   * Get profile's country
   * @param {string} userId
   * @returns {Promise<string|undefined>}
   */
  async getUserCountry(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Set profile's country and recalc is_active
   * @param {string} userId
   * @param {string} countryCode
   * @returns {Promise<boolean>} New is_active value
   */
  async setUserCountry(userId, countryCode) {
    throw new Error('Method not implemented');
  }

  /**
   * Add a game to user's game profiles and recalc is_active
   * @param {string} userId
   * @param {number} gameId
   * @returns {Promise<boolean>} New is_active value
   */
  async addGame(userId, gameId) {
    throw new Error('Method not implemented');
  }
  /**
   * Remove a game and recalc is_active
   * @param {string} userId
   * @param {number} gameId
   * @returns {Promise<boolean>} New is_active value
   */
  async removeGame(userId, gameId) {
    throw new Error('Method not implemented');
  }
  /**
   * List selected games for a user
   * @param {string} userId
   * @returns {Promise<import('../entities/Game').Game[]>}
   */
  async findUserGames(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Set profile's active status and recalc is_active
   * @param {string} userId
   * @param {boolean} isActive
   * @returns {Promise<boolean>} New is_active value
   */
  async setActive(userId, isActive) {
    throw new Error('Method not implemented');
  }

  /**
   * Recalculate profile's active status and recalc is_active
   * @param {string} userId
   * @returns {Promise<boolean>} New is_active value
   */
  async recalculateActive(userId) {
    throw new Error('Method not implemented');
  }
}
