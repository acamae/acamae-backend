/**
 * @typedef {Object} TeamRepository
 * @property {function(): Promise<Team[]>} findAll - Get all teams
 * @property {function(string): Promise<Team|null>} findById - Get a team by its ID
 * @property {function(string): Promise<Team[]>} findByUserId - Get teams by user ID
 * @property {function(string, CreateTeamDto): Promise<Team>} create - Create a new team
 * @property {function(string, UpdateTeamDto): Promise<Team>} update - Update a team
 * @property {function(string): Promise<void>} delete - Delete a team
 */

export class TeamRepository {
  /**
   * @TODO: Implement this method
   * Get all teams
   * @returns {Promise<Team[]>}
   */
  async findAll() {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Get a team by its ID
   * @param {string} id
   * @returns {Promise<Team|null>}
   */
  // eslint-disable-next-line
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Get teams by user ID
   * @param {string} userId
   * @returns {Promise<Team[]>}
   */
  // eslint-disable-next-line
  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Create a new team
   * @param {string} userId
   * @param {CreateTeamDto} data
   * @returns {Promise<Team>}
   */
  // eslint-disable-next-line
  async create(userId, data) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Update a team
   * @param {string} id
   * @param {UpdateTeamDto} data
   * @returns {Promise<Team>}
   */
  // eslint-disable-next-line
  async update(id, data) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Delete a team
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line
  async delete(id) {
    throw new Error('Method not implemented');
  }
}
