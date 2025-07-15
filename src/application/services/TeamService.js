import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

/**
 * Team service
 * Handles team-related business logic
 *
 * @param {TeamRepository} teamRepository
 * @param {import('../../domain/repositories/UserRepository').UserRepository} userRepository
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
    const teams = await this.teamRepository.findAll();

    if (!teams) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [{ field: 'team', code: 'DATABASE_ERROR', message: 'Error getting teams' }],
        },
      });
    }

    return teams;
  }

  /**
   * Get a team by its ID
   * @param {string} id
   * @returns {Promise<Team|null>}
   */
  async getTeamById(id) {
    const team = await this.teamRepository.findById(id);

    if (!team) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NOT_FOUND],
        code: API_ERROR_CODES.TEAM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'team',
              code: 'NOT_FOUND',
              message: 'Team not found',
            },
          ],
        },
      });
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

    const allTeams = await this.teamRepository.findAll();
    const existingTeam = allTeams.find((t) => t.name === name || t.tag === tag);

    if (existingTeam) {
      if (existingTeam.name === name) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS],
          code: API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'team',
                code: 'NAME_ALREADY_EXISTS',
                message: 'The team name already exists',
              },
            ],
          },
        });
      }
      if (existingTeam.tag === tag) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS],
          code: API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'team',
                code: 'TAG_ALREADY_EXISTS',
                message: 'The team tag already exists',
              },
            ],
          },
        });
      }
    }

    const createdTeam = await this.teamRepository.create(ownerId, { name, tag });

    if (!createdTeam) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [{ field: 'team', code: 'DATABASE_ERROR', message: 'Error creating team' }],
        },
      });
    }

    return createdTeam;
  }

  /**
   * Update a team
   * @param {string} id
   * @param {UpdateTeamDto} data
   * @returns {Promise<Team>}
   */
  async updateTeam(id, teamData) {
    const { name, tag } = teamData;

    const teams = await this.teamRepository.findAll();
    const existingTeam = teams.find((t) => (t.name === name || t.tag === tag) && t.id !== id);

    if (existingTeam) {
      if (existingTeam.name === name) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS],
          code: API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'team',
                code: 'NAME_ALREADY_EXISTS',
                message: 'The team name already exists',
              },
            ],
          },
        });
      }
      if (existingTeam.tag === tag) {
        throw createError({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS],
          code: API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT,
          errorDetails: {
            type: 'business',
            details: [
              {
                field: 'team',
                code: 'TAG_ALREADY_EXISTS',
                message: 'The team tag already exists',
              },
            ],
          },
        });
      }
    }

    const updatedTeam = await this.teamRepository.update(id, teamData);

    if (!updatedTeam) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [{ field: 'team', code: 'DATABASE_ERROR', message: 'Error updating team' }],
        },
      });
    }

    return updatedTeam;
  }

  /**
   * Delete a team
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteTeam(id) {
    const team = await this.teamRepository.findById(id);

    if (!team) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NOT_FOUND],
        code: API_ERROR_CODES.TEAM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'team',
              code: 'NOT_FOUND',
              message: 'Team not found',
            },
          ],
        },
      });
    }

    const deleted = await this.teamRepository.delete(id);

    if (!deleted) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [{ field: 'team', code: 'DATABASE_ERROR', message: 'Error deleting team' }],
        },
      });
    }

    return true;
  }

  async addMember(teamId, userId) {
    const team = await this.teamRepository.findById(teamId);

    if (!team) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NOT_FOUND],
        code: API_ERROR_CODES.TEAM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'team',
              code: 'NOT_FOUND',
              message: 'Team not found',
            },
          ],
        },
      });
    }

    const member = await this.userRepository.findById(userId);

    if (!member) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.AUTH_USER_NOT_FOUND],
        code: API_ERROR_CODES.AUTH_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'member',
              code: 'NOT_FOUND',
              message: 'Member not found',
            },
          ],
        },
      });
    }

    // Check if the user is already a member
    if (team.members.some((member) => member.id === userId)) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.USER_ALREADY_IN_TEAM],
        code: API_ERROR_CODES.USER_ALREADY_IN_TEAM,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'member',
              code: 'ALREADY_IN_TEAM',
              message: 'The user is already a member of the team',
            },
          ],
        },
      });
    }

    const updatedTeam = await this.teamRepository.addMember(teamId, userId);

    if (!updatedTeam) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            { field: 'team', code: 'DATABASE_ERROR', message: 'Error adding member to team' },
          ],
        },
      });
    }

    return updatedTeam;
  }

  async removeMember(teamId, userId) {
    const team = await this.teamRepository.findById(teamId);

    if (!team) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NOT_FOUND],
        code: API_ERROR_CODES.TEAM_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'team',
              code: 'NOT_FOUND',
              message: 'Team not found',
            },
          ],
        },
      });
    }

    // Check if the user is a member
    if (!team.members.some((member) => member.id === userId)) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.USER_NOT_IN_TEAM],
        code: API_ERROR_CODES.USER_NOT_IN_TEAM,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'member',
              code: 'NOT_IN_TEAM',
              message: 'The user is not a member of the team',
            },
          ],
        },
      });
    }

    // Do not allow removing the team owner
    if (team.ownerId === userId) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.CANNOT_REMOVE_OWNER],
        code: API_ERROR_CODES.CANNOT_REMOVE_OWNER,
        status: HTTP_STATUS.CONFLICT,
        errorDetails: {
          type: 'business',
          details: [
            {
              field: 'team',
              code: 'OWNER',
              message: 'Cannot remove the team owner',
            },
          ],
        },
      });
    }

    const updatedTeam = await this.teamRepository.removeMember(teamId, userId);

    if (!updatedTeam) {
      throw createError({
        message: ERROR_MESSAGES[API_ERROR_CODES.DATABASE_ERROR],
        code: API_ERROR_CODES.DATABASE_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorDetails: {
          type: 'server',
          details: [
            { field: 'team', code: 'DATABASE_ERROR', message: 'Error removing member from team' },
          ],
        },
      });
    }

    return updatedTeam;
  }
}
