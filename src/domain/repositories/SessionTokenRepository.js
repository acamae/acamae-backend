/**
 * @typedef {Object} SessionToken
 * @property {string} id
 * @property {string} userId
 * @property {string} token
 * @property {Date} lastActivityAt
 * @property {Date} expiresAt
 * @property {Date} createdAt
 */

/**
 * SessionTokenRepository interface
 */
export class SessionTokenRepository {
  /**
   * @param {{userId: string, token: string, lastActivityAt: Date, expiresAt: Date}} data
   * @returns {Promise<SessionToken>}
   */
  async create(_data) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} token
   * @returns {Promise<SessionToken|null>}
   */
  async findByToken(_token) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteById(_id) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} token
   * @returns {Promise<number>} number of deleted rows
   */
  async deleteByToken(_token) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} id
   * @param {Partial<{token:string; lastActivityAt:Date; expiresAt:Date}>} data
   * @returns {Promise<SessionToken>}
   */
  async update(_id, _data) {
    throw new Error('Method not implemented');
  }
}
