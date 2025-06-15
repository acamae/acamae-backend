import { PrismaClient } from '@prisma/client';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

const prisma = new PrismaClient();

export class UserService {
  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('User not found', API_ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async updateUser(id, userData) {
    const { email, username } = userData;

    // Verificar si el email o username ya existen
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
          NOT: {
            id,
          },
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw createError('The email already exists', API_ERROR_CODES.EMAIL_ALREADY_EXISTS);
        }
        if (existingUser.username === username) {
          throw createError('The username already exists', API_ERROR_CODES.USERNAME_ALREADY_EXISTS);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', API_ERROR_CODES.USER_NOT_FOUND);
    }

    await prisma.user.delete({
      where: { id },
    });

    return true;
  }
}
