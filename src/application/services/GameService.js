import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * @typedef {import('../../domain/entities/Game.js').Game} Game
 * @typedef {import('../../domain/repositories/GameRepository.js').GameRepository} GameRepository
 */

export class GameService {
  /**
   * @param {GameRepository} gameRepository
   * @param {import('../../domain/repositories/UserRepository.js').UserRepository} userRepository
   */
  constructor(gameRepository, userRepository) {
    this.gameRepository = gameRepository;
    this.userRepository = userRepository;
  }

  /**
   * @returns {Promise<Game[]>}
   */
  async listGames() {
    try {
      return await this.gameRepository.findAll();
    } catch (error) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            { field: 'database', code: 'DATABASE_ERROR', message: 'Failed to fetch games' },
          ],
        },
      });
    }
  }
}
