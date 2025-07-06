/**
 * @typedef {Object} UserRepository
 * @property {function(string): Promise<User|null>} findByEmail - Find a user by email
 * @property {function(string): Promise<User|null>} findByUsername - Find a user by username
 * @property {function(string): Promise<User|null>} findById - Find a user by ID
 * @property {function(): Promise<User[]>} findAll - Get all users
 * @property {function(CreateUserDto): Promise<User>} create - Create a new user
 * @property {function(string, UpdateUserDto): Promise<User>} update - Update a user
 * @property {function(string): Promise<boolean>} delete - Delete a user
 * @property {function(string, string, Date): Promise<void>} setVerificationToken - Set the verification token
 * @property {function(string, boolean): Promise<void>} setVerified - Set the verification status
 * @property {function(string, string, Date): Promise<void>} setResetToken - Set the reset token
 * @property {function(string, string[]): Promise<User|null>} findByIdWithFields - Find user by ID with specific fields
 * @property {function(): Promise<number>} cleanExpiredVerificationTokens - Clean expired verification tokens
 */

/**
 * @TODO: Implement this interface
 * Interface for user repository operations
 * @interface
 */
export class UserRepository {
  /**
   * @TODO: Implement this method
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Find a user by username
   * @param {string} username - User username
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line
  async findByUsername(username) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Create a new user
   * @param {import('../entities/User').User} user - User data
   * @returns {Promise<import('../entities/User').User>}
   */
  // eslint-disable-next-line
  async create(user) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Update a user
   * @param {number} id - User ID
   * @param {Partial<import('../entities/User').User>} data - User data to update
   * @returns {Promise<import('../entities/User').User>}
   */
  // eslint-disable-next-line
  async update(id, data) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Find all users with pagination
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {Object} options.filters - Filter criteria
   * @returns {Promise<{data: import('../entities/User').User[], total: number, page: number, limit: number}>}
   */
  // eslint-disable-next-line
  async findAll({ page = 1, limit = 10, filters = {} } = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Find a user by verification token
   * @param {string} token - Verification token
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line
  async findByVerificationToken(token) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Find a user by reset token
   * @param {string} token - Reset token
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line
  async findByResetToken(token) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Set the verification token
   * @param {string} id
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line
  async setVerificationToken(id, token, expiresAt) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Set the verification status
   * @param {string} id
   * @param {boolean} isVerified
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line
  async setVerified(id, isVerified) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Set the reset token
   * @param {string} id
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line
  async setResetToken(id, token, expiresAt) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Find a user by ID with specific fields only (optimized for auth middleware)
   * @param {string} id - User ID
   * @param {string[]} fields - Fields to select
   * @returns {Promise<Partial<import('../entities/User').User>|null>}
   */
  // eslint-disable-next-line
  async findByIdWithFields(id, fields = []) {
    throw new Error('Method not implemented');
  }

  /**
   * @TODO: Implement this method
   * Clean expired verification tokens (bulk operation)
   * @returns {Promise<number>} Number of tokens cleaned
   */
  // eslint-disable-next-line
  async cleanExpiredVerificationTokens() {
    throw new Error('Method not implemented');
  }
}
