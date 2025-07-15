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
 * Interface for user repository operations
 * @interface
 */
export class UserRepository {
  /**
   * Find a user by ID
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }
  /**
   * Find a user by email
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }
  /**
   * Find a user by username
   * @param {string} username
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    throw new Error('Method not implemented');
  }
  /**
   * Create a new user
   * @param {User} user
   * @returns {Promise<User>}
   */
  async create(user) {
    throw new Error('Method not implemented');
  }
  /**
   * Update a user
   * @param {string} id
   * @param {Partial<User>} data
   * @returns {Promise<User>}
   */
  async update(id, data) {
    throw new Error('Method not implemented');
  }
  /**
   * Delete a user
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
  /**
   * Find all users
   * @param {Object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=10]
   * @param {Object} [options.filters={}]
   * @returns {Promise<User[]>}
   */
  async findAll({ page = 1, limit = 10, filters = {} } = {}) {
    throw new Error('Method not implemented');
  }
  /**
   * Find a user by verification token
   * @param {string} token
   * @returns {Promise<User|null>}
   */
  async findByVerificationToken(token) {
    throw new Error('Method not implemented');
  }
  /**
   * Find a user by reset token
   * @param {string} token
   * @returns {Promise<User|null>}
   */
  async findByResetToken(token) {
    throw new Error('Method not implemented');
  }
  /**
   * Set a verification token for a user
   * @param {string} id
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<void>}
   */
  async setVerificationToken(id, token, expiresAt) {
    throw new Error('Method not implemented');
  }
  /**
   * Set the verified status for a user
   * @param {string} id
   * @param {boolean} isVerified
   * @returns {Promise<void>}
   */
  async setVerified(id, isVerified) {
    throw new Error('Method not implemented');
  }
  /**
   * Set a reset token for a user
   * @param {string} id
   * @param {string} resetToken
   * @param {Date} resetExpiresAt
   * @returns {Promise<void>}
   */
  async setResetToken(id, resetToken, resetExpiresAt) {
    throw new Error('Method not implemented');
  }
  /**
   * Find a user by ID with specific fields
   * @param {string} id
   * @param {string[]} fields
   * @returns {Promise<User|null>}
   */
  async findByIdWithFields(id, fields = []) {
    throw new Error('Method not implemented');
  }
  /**
   * Clean expired verification tokens
   * @returns {Promise<number>}
   */
  async cleanExpiredVerificationTokens() {
    throw new Error('Method not implemented');
  }
  /**
   * Set a new password for a user
   * @param {string} id
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async setNewPassword(id, newPassword) {
    throw new Error('Method not implemented');
  }
}
