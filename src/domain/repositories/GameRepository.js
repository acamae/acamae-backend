/**
 * @typedef {import('../entities/Game.js').Game} Game
 */

/**
 * @interface GameRepository
 */
export class GameRepository {
  /**
   * @returns {Promise<Game[]>}
   */
  async findAll() {
    throw new Error('Not implemented');
  }

  /**
   * @param {number|string} id
   * @returns {Promise<Game|null>}
   */
  async findById(id) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} code
   * @returns {Promise<Game|null>}
   */
  async findByCode(code) {
    throw new Error('Not implemented');
  }
}
