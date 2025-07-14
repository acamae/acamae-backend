/**
 * @typedef {Object} TeamRepository
 * @property {function(): Promise<Team[]>} findAll - Get all teams
 * @property {function(string): Promise<Team|null>} findById - Get a team by its ID
 * @property {function(string): Promise<Team[]>} findByUserId - Get teams by user ID
 * @property {function(string, CreateTeamDto): Promise<Team>} create - Create a new team
 * @property {function(string, UpdateTeamDto): Promise<Team>} update - Update a team
 * @property {function(string): Promise<void>} delete - Delete a team
 * @property {function(string, string): Promise<Team>} addMember - Add a member to a team
 * @property {function(string, string): Promise<Team>} removeMember - Remove a member from a team
 */

export class TeamRepository {
  /**
   * Get all teams
   * @returns {Promise<Team[]>}
   */
  async findAll() {
    throw new Error('Method not implemented');
  }

  /**
   * Get a team by its ID
   * @param {string} id
   * @returns {Promise<Team|null>}
   */
  // eslint-disable-next-line
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Get teams by user ID
   * @param {string} userId
   * @returns {Promise<Team[]>}
   */
  // eslint-disable-next-line
  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get a team by its name
   * @param {string} teamName
   * @returns {Promise<Team|null>}
   */
  // eslint-disable-next-line
  async findByTeamName(teamName) {
    throw new Error('Method not implemented');
  }

  /**
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
   * Delete a team
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Add a member to a team
   * @param {string} teamId
   * @param {string} userId
   * @returns {Promise<Team>}
   */
  // eslint-disable-next-line
  async addMember(teamId, userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove a member from a team
   * @param {string} teamId
   * @param {string} userId
   * @returns {Promise<Team>}
   */
  // eslint-disable-next-line
  async removeMember(teamId, userId) {
    throw new Error('Method not implemented');
  }
}
