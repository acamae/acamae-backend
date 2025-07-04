import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Implementation of the user repository using Prisma
 * @implements {import('../../domain/repositories/UserRepository').UserRepository}
 */
export class PrismaUserRepository {
  /** @type {PrismaClient} */
  #prisma;

  constructor() {
    this.#prisma = new PrismaClient();
  }

  /**
   * Convert a Prisma model to a domain entity
   * @param {any} prismaUser
   * @returns {import('../../domain/entities/User').User|null}
   */
  #toDomainModel(prismaUser) {
    if (!prismaUser) return null;

    return {
      id: prismaUser.id.toString(),
      username: prismaUser.username,
      email: prismaUser.email,
      passwordHash: prismaUser.password_hash,
      firstName: prismaUser.first_name || undefined,
      lastName: prismaUser.last_name || undefined,
      role: prismaUser.role,
      isVerified: prismaUser.is_verified,
      verificationToken: prismaUser.verification_token || undefined,
      verificationExpiresAt: prismaUser.verification_expires_at || undefined,
      resetToken: prismaUser.reset_token || undefined,
      resetExpiresAt: prismaUser.reset_expires_at || undefined,
      createdAt: prismaUser.created_at,
      updatedAt: prismaUser.updated_at,
    };
  }

  /**
   * Find all users
   * @returns {Promise<import('../../domain/entities/User').User[]>}
   */
  async findAll() {
    const users = await this.#prisma.user.findMany();
    return users.map((user) => this.#toDomainModel(user)).filter(Boolean);
  }

  /**
   * Find a user by its ID
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User').User|null>}
   */
  async findById(id) {
    const user = await this.#prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    return user ? this.#toDomainModel(user) : null;
  }

  /**
   * Find a user by its username
   * @param {string} username
   * @returns {Promise<import('../../domain/entities/User').User|null>}
   */
  async findByUsername(username) {
    const user = await this.#prisma.user.findUnique({
      where: { username },
    });
    return user ? this.#toDomainModel(user) : null;
  }

  /**
   * Find a user by its email
   * @param {string} email
   * @returns {Promise<import('../../domain/entities/User').User|null>}
   */
  async findByEmail(email) {
    const user = await this.#prisma.user.findUnique({
      where: { email },
    });
    return user ? this.#toDomainModel(user) : null;
  }

  /**
   * Create a new user
   * @param {CreateUserDto} userData
   * @returns {Promise<import('../../domain/entities/User').User>}
   */
  async create(userData) {
    try {
      const passwordHash = await bcrypt.hash(userData.password, 10);

      const user = await this.#prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password_hash: passwordHash,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'user',
          is_verified: false,
          verification_token: userData.verificationToken,
          verification_expires_at: userData.verificationExpiresAt,
          reset_token: userData.resetToken,
          reset_expires_at: userData.resetExpiresAt,
        },
      });

      return this.#toDomainModel(user);
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw createError('Email already exists', API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS);
        }
        if (error.meta?.target?.includes('username')) {
          throw createError('Username already exists', API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS);
        }
      }
      throw error;
    }
  }

  /**
   * Update an existing user
   * @param {string} id
   * @param {UpdateUserDto} userData
   * @returns {Promise<import('../../domain/entities/User').User>}
   */
  async update(id, userData) {
    const data = {
      username: userData.username,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
      is_verified: userData.isVerified,
      verification_token: userData.verificationToken,
      verification_expires_at: userData.verificationExpiresAt,
      reset_token: userData.resetToken,
      reset_expires_at: userData.resetExpiresAt,
    };

    if (userData.password) {
      data.password_hash = await bcrypt.hash(userData.password, 10);
    }

    const user = await this.#prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });

    return this.#toDomainModel(user);
  }

  /**
   * Delete a user
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.#prisma.user.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Set the verification status of a user
   * @param {string} id
   * @param {boolean} isVerified
   * @returns {Promise<import('../../domain/entities/User').User>}
   */
  async setVerified(id, isVerified) {
    const user = await this.#prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        is_verified: isVerified,
        verification_token: null,
        verification_expires_at: null,
      },
    });

    return this.#toDomainModel(user);
  }

  /**
   * Set the verification token for a user
   * @param {string} id
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<import('../../domain/entities/User').User>}
   */
  async setVerificationToken(id, token, expiresAt) {
    const user = await this.#prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        verification_token: token,
        verification_expires_at: expiresAt,
      },
    });

    return this.#toDomainModel(user);
  }

  /**
   * Set the reset token for a user
   * @param {string} id
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<import('../../domain/entities/User').User>}
   */
  async setResetToken(id, token, expiresAt) {
    const user = await this.#prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        reset_token: token,
        reset_expires_at: expiresAt,
      },
    });

    return this.#toDomainModel(user);
  }

  /**
   * Find a user by verification token
   * @param {string} token - Verification token
   * @returns {Promise<import('../../domain/entities/User').User|null>}
   */
  async findByVerificationToken(token) {
    const user = await this.#prisma.user.findFirst({
      where: {
        verification_token: token,
        verification_expires_at: {
          gt: new Date(),
        },
      },
    });

    return user ? this.#toDomainModel(user) : null;
  }

  /**
   * Find a user by reset token
   * @param {string} token - Reset token
   * @returns {Promise<import('../../domain/entities/User').User|null>}
   */
  async findByResetToken(token) {
    const user = await this.#prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_expires_at: {
          gt: new Date(),
        },
      },
    });

    return user ? this.#toDomainModel(user) : null;
  }
}
