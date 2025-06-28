import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * Get all users
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  getAllUsers = async (req, res, next) => {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a user by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  getUserById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        const notFoundError = createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
          API_ERROR_CODES.AUTH_USER_NOT_FOUND,
          404
        );
        return next(notFoundError);
      }

      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userData = req.body;

      const updatedUser = await this.userService.updateUser(id, userData);

      if (!updatedUser) {
        const notFoundError = createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
          API_ERROR_CODES.AUTH_USER_NOT_FOUND,
          404
        );
        return next(notFoundError);
      }

      res
        .status(200)
        .json({ status: 'success', message: 'User updated successfully', data: updatedUser });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        const notFoundError = createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
          API_ERROR_CODES.AUTH_USER_NOT_FOUND,
          404
        );
        return next(notFoundError);
      }

      res.status(200).json({ status: 'success', message: 'User deleted successfully', data: null });
    } catch (error) {
      next(error);
    }
  };
}
