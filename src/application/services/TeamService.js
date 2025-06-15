import { PrismaClient } from '@prisma/client';

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

const prisma = new PrismaClient();

/**
 * Team service
 */
export class TeamService {
  /**
   * @param {TeamRepository} teamRepository
   * @param {UserRepository} userRepository
   */
  constructor(teamRepository, userRepository) {
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
  }

  /**
   * Get all teams
   * @returns {Promise<Team[]>}
   */
  async getAllTeams() {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return teams;
  }

  /**
   * Get a team by its ID
   * @param {string} id
   * @returns {Promise<Team|null>}
   */
  async getTeamById(id) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!team) {
      throw createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND);
    }

    return team;
  }

  /**
   * Create a new team
   * @param {CreateTeamDto} data
   * @returns {Promise<Team>}
   */
  async createTeam(teamData) {
    const { name, tag, ownerId } = teamData;

    // Verificar si el nombre o tag ya existen
    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [{ name }, { tag }],
      },
    });

    if (existingTeam) {
      if (existingTeam.name === name) {
        throw createError('The team name already exists', API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS);
      }
      if (existingTeam.tag === tag) {
        throw createError('The team tag already exists', API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS);
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        tag,
        ownerId,
        members: {
          connect: [{ id: ownerId }],
        },
      },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return team;
  }

  /**
   * Update a team
   * @param {string} id
   * @param {UpdateTeamDto} data
   * @returns {Promise<Team>}
   */
  async updateTeam(id, teamData) {
    const { name, tag } = teamData;

    // Verificar si el nombre o tag ya existen
    if (name || tag) {
      const existingTeam = await prisma.team.findFirst({
        where: {
          OR: [{ name }, { tag }],
          NOT: {
            id,
          },
        },
      });

      if (existingTeam) {
        if (existingTeam.name === name) {
          throw createError(
            'The team name already exists',
            API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS
          );
        }
        if (existingTeam.tag === tag) {
          throw createError('The team tag already exists', API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS);
        }
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: teamData,
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return team;
  }

  /**
   * Delete a team
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteTeam(id) {
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND);
    }

    await prisma.team.delete({
      where: { id },
    });

    return true;
  }

  async addMember(teamId, userId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      throw createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError('User not found', API_ERROR_CODES.USER_NOT_FOUND);
    }

    // Verificar si el usuario ya es miembro
    if (team.members.some((member) => member.id === userId)) {
      throw createError(
        'The user is already a member of the team',
        API_ERROR_CODES.USER_ALREADY_IN_TEAM
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          connect: [{ id: userId }],
        },
      },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedTeam;
  }

  async removeMember(teamId, userId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      throw createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND);
    }

    // Verificar si el usuario es miembro
    if (!team.members.some((member) => member.id === userId)) {
      throw createError('The user is not a member of the team', API_ERROR_CODES.USER_NOT_IN_TEAM);
    }

    // No permitir eliminar al dueño del equipo
    if (team.ownerId === userId) {
      throw createError('Cannot remove the team owner', API_ERROR_CODES.CANNOT_REMOVE_OWNER);
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          disconnect: [{ id: userId }],
        },
      },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedTeam;
  }
}
