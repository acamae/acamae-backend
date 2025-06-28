import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

export class UserService {
  /**
   * @param {import('../../domain/repositories/UserRepository.js').UserRepository} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Get all users
   * @returns {Promise<Array<object>>}
   */
  async getAllUsers() {
    const users = await this.userRepository.findAll();
    // Remove sensitive fields
    return users.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Get a single user by id
   * @param {string} id
   */
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        API_ERROR_CODES.AUTH_USER_NOT_FOUND
      );
    }
    const { passwordHash, ...cleanUser } = user;
    return cleanUser;
  }

  /**
   * Update user
   */
  async updateUser(id, userData) {
    const { email, username } = userData;

    // Check duplicates
    if (email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS],
          API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS
        );
      }
    }
    if (username) {
      const existing = await this.userRepository.findByUsername(username);
      if (existing && existing.id !== id) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS],
          API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS
        );
      }
    }

    const updated = await this.userRepository.update(id, userData);
    const { passwordHash, ...cleanUser } = updated;
    return cleanUser;
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        API_ERROR_CODES.AUTH_USER_NOT_FOUND
      );
    }

    await this.userRepository.delete(id);
    return true;
  }
}
