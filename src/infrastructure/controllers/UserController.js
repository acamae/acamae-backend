import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

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
        .apiSuccess(result.users, 'Usuarios obtenidos exitosamente', meta);
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

      if (!user) {
        // Use RESOURCE_NOT_FOUND according to Swagger
        const notFoundError = createError(
          'El usuario solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to Swagger: User object
      return res.status(HTTP_STATUS.OK).apiSuccess(user, 'Usuario obtenido exitosamente');
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

      if (!updatedUser) {
        // Use RESOURCE_NOT_FOUND according to Swagger
        const notFoundError = createError(
          'El usuario solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to Swagger: updated User object
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedUser, 'Usuario actualizado exitosamente');
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
      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        // Use RESOURCE_NOT_FOUND according to Swagger
        const notFoundError = createError(
          'El usuario solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to Swagger: data null
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Usuario eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}
