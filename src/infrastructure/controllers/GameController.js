import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export class GameController {
  /**
   * @param {import('../../application/services/GameService.js').GameService} gameService
   */
  constructor(gameService) {
    this.gameService = gameService;
  }

  /**
   * List games catalog
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async listGames(_req, res, next) {
    try {
      const games = await this.gameService.listGames();
      return res.status(HTTP_STATUS.OK).apiSuccess({ games }, 'Games catalog');
    } catch (error) {
      next(error);
    }
  }
}
