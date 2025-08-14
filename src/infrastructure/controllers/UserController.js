import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * Get all users with pagination
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllUsers(req, res, next) {
    try {
      // Extract pagination parameters according to Swagger
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await this.userService.getAllUsers({ page, limit });

      // Structure according to Swagger with pagination
      const meta = {
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      };

      return res
        .status(HTTP_STATUS.OK)
        .apiSuccess(result.users, 'Users retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a user by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const updatedUser = await this.userService.updateUser(id, userData);
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedUser, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user public profile
   */
  async getPublicProfile(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.userService.getPublicProfile(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Public profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get availability
   */
  async getAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.userService.getAvailability(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Availability retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Replace availability
   */
  async replaceAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const data = await this.userService.replaceAvailability(id, payload);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Availability updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add game
   */
  async addGame(req, res, next) {
    try {
      const { id } = req.params;
      const { gameId } = req.body || {};
      const data = await this.userService.addGame(id, gameId);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Games updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove game
   */
  async removeGame(req, res, next) {
    try {
      const { id } = req.params;
      const { gameId } = req.body || {};
      const data = await this.userService.removeGame(id, gameId);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Games updated');
    } catch (error) {
      next(error);
    }
  }
}
