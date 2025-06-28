import { PrismaClient } from '@prisma/client';

/**
 * Implementation of the team repository using Prisma
 * @implements {import('../../domain/repositories/TeamRepository').TeamRepository}
 */
export class PrismaTeamRepository {
  /** @type {PrismaClient} */
  #prisma;

  constructor() {
    this.#prisma = new PrismaClient();
  }

  /**
   * Convert a Prisma model to a domain entity
   * @param {any} prismaTeam
   * @returns {import('../../domain/entities/Team').Team|null}
   */
  #toDomainModel(prismaTeam) {
    if (!prismaTeam) return null;

    return {
      id: prismaTeam.id.toString(),
      userId: prismaTeam.userId.toString(),
      name: prismaTeam.name,
      tag: prismaTeam.tag,
      logoFilename: prismaTeam.logo_filename || undefined,
      description: prismaTeam.description || undefined,
      createdAt: prismaTeam.created_at,
      updatedAt: prismaTeam.updated_at,
      user: prismaTeam.user
        ? {
            id: prismaTeam.user.id.toString(),
            username: prismaTeam.user.username,
            email: prismaTeam.user.email,
            passwordHash: prismaTeam.user.password_hash,
            role: prismaTeam.user.role,
            isVerified: prismaTeam.user.is_verified,
            createdAt: prismaTeam.user.created_at,
            updatedAt: prismaTeam.user.updated_at,
          }
        : undefined,
    };
  }

  /**
   * Find all teams
   * @returns {Promise<import('../../domain/entities/Team').Team[]>}
   */
  async findAll() {
    const teams = await this.#prisma.team.findMany({
      include: { user: true },
    });
    return teams.map((team) => this.#toDomainModel(team)).filter(Boolean);
  }

  /**
   * Find a team by its ID
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/Team').Team|null>}
   */
  async findById(id) {
    const team = await this.#prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });
    return team ? this.#toDomainModel(team) : null;
  }

  /**
   * Find teams by user ID
   * @param {string} userId
   * @returns {Promise<import('../../domain/entities/Team').Team[]>}
   */
  async findByUserId(userId) {
    const teams = await this.#prisma.team.findMany({
      where: { userId: parseInt(userId) },
      include: { user: true },
    });
    return teams.map((team) => this.#toDomainModel(team)).filter(Boolean);
  }

  /**
   * Create a new team
   * @param {string} userId
   * @param {CreateTeamDto} data
   * @returns {Promise<import('../../domain/entities/Team').Team>}
   */
  async create(userId, data) {
    const team = await this.#prisma.team.create({
      data: {
        userId: parseInt(userId),
        name: data.name,
        logo_filename: data.logoFilename,
        description: data.description,
      },
      include: { user: true },
    });
    return this.#toDomainModel(team);
  }

  /**
   * Update an existing team
   * @param {string} id
   * @param {UpdateTeamDto} data
   * @returns {Promise<Team>}
   */
  async update(id, data) {
    const team = await this.#prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        logo_filename: data.logoFilename,
        description: data.description,
      },
      include: { user: true },
    });
    return this.#toDomainModel(team);
  }

  /**
   * Delete a team
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.#prisma.team.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Add a member to a team (many-to-many through implicit relation)
   * @param {string} teamId
   * @param {string} userId
   */
  async addMember(teamId, userId) {
    const team = await this.#prisma.team.update({
      where: { id: parseInt(teamId) },
      data: {
        members: {
          connect: { id: parseInt(userId) },
        },
      },
      include: { user: true, members: true },
    });
    return this.#toDomainModel(team);
  }

  /**
   * Remove a member from a team
   * @param {string} teamId
   * @param {string} userId
   */
  async removeMember(teamId, userId) {
    const team = await this.#prisma.team.update({
      where: { id: parseInt(teamId) },
      data: {
        members: {
          disconnect: { id: parseInt(userId) },
        },
      },
      include: { user: true, members: true },
    });
    return this.#toDomainModel(team);
  }
}
