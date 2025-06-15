import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';

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
  getAllUsers = async (req, res) => {
    try {
      const users = await this.userService.getAllUsers();
      res.success(users);
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Get a user by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        return res.notFound('Usuario no encontrado', API_ERROR_CODES.USER_NOT_FOUND);
      }

      res.success(user);
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Update a user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const userData = req.body;

      const updatedUser = await this.userService.updateUser(id, userData);

      if (!updatedUser) {
        return res.notFound('Usuario no encontrado', API_ERROR_CODES.USER_NOT_FOUND);
      }

      res.success(updatedUser, 'Usuario actualizado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Delete a user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        return res.notFound('Usuario no encontrado', API_ERROR_CODES.USER_NOT_FOUND);
      }

      res.success(null, 'Usuario eliminado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };
}
