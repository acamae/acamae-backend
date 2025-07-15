import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

/** @typedef {import('express').Response} Response */

export class TeamController {
  constructor(teamService) {
    this.teamService = teamService;
  }

  /**
   * Get all teams
   * @param {import('express').Request} _req
   * @param {Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllTeams(_req, res, next) {
    try {
      const teams = await this.teamService.getAllTeams();
      return res.status(HTTP_STATUS.OK).apiSuccess(teams, 'Teams retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a team by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getTeamById(req, res, next) {
    try {
      const { id } = req.params;
      const team = await this.teamService.getTeamById(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(team, 'Team retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createTeam(req, res, next) {
    try {
      const teamData = req.body;
      const newTeam = await this.teamService.createTeam(teamData);
      return res.status(HTTP_STATUS.CREATED).apiSuccess(newTeam, 'Team created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateTeam(req, res, next) {
    try {
      const { id } = req.params;
      const teamData = req.body;
      const updatedTeam = await this.teamService.updateTeam(id, teamData);
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedTeam, 'Team updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteTeam(req, res, next) {
    try {
      const { id } = req.params;
      const deletedTeam = await this.teamService.deleteTeam(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(deletedTeam, 'Team deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a member to a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async addMember(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const updatedTeam = await this.teamService.addMember(id, userId);
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedTeam, 'Member added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a member from a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async removeMember(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const updatedTeam = await this.teamService.removeMember(id, userId);
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedTeam, 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  }
}
