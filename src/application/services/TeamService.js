import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

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
    const teams = await this.teamRepository.findAll();
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

    const allTeams = await this.teamRepository.findAll();
    const existingTeam = allTeams.find((t) => t.name === name || t.tag === tag);

    if (existingTeam) {
      if (existingTeam.name === name) {
        throw createError('The team name already exists', API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS);
      }
      if (existingTeam.tag === tag) {
        throw createError('The team tag already exists', API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS);
      }
    }

    const team = await this.teamRepository.create(ownerId, { name, tag });

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

    const teams = await this.teamRepository.findAll();
    const existingTeam = teams.find((t) => (t.name === name || t.tag === tag) && t.id !== id);

    if (existingTeam) {
      if (existingTeam.name === name) {
        throw createError('The team name already exists', API_ERROR_CODES.TEAM_NAME_ALREADY_EXISTS);
      }
      if (existingTeam.tag === tag) {
        throw createError('The team tag already exists', API_ERROR_CODES.TEAM_TAG_ALREADY_EXISTS);
      }
    }

    const team = await this.teamRepository.update(id, teamData);

    return team;
  }

  /**
   * Delete a team
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteTeam(id) {
    const team = await this.teamRepository.findById(id);

    if (!team) {
      throw createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND);
    }

    await this.teamRepository.delete(id);

    return true;
  }

  async addMember(teamId, userId) {
    const team = await this.teamRepository.findById(teamId);

    if (!team) {
      throw createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw createError('User not found', API_ERROR_CODES.AUTH_USER_NOT_FOUND);
    }

    // Verificar si el usuario ya es miembro
    if (team.members.some((member) => member.id === userId)) {
      throw createError(
        'The user is already a member of the team',
        API_ERROR_CODES.USER_ALREADY_IN_TEAM
      );
    }

    const updatedTeam = await this.teamRepository.addMember(teamId, userId);

    return updatedTeam;
  }

  async removeMember(teamId, userId) {
    const team = await this.teamRepository.findById(teamId);

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

    const updatedTeam = await this.teamRepository.removeMember(teamId, userId);

    return updatedTeam;
  }
}
