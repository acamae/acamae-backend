/** @typedef {import('express').Response} Response */

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { createError } from '../../shared/utils/error.js';

export class TeamController {
  constructor(teamService) {
    this.teamService = teamService;
  }

  /**
   * Get all teams
   * @param {import('express').Request} req
   * @param {Response} res
   * @param {import('express').NextFunction} next
   */
  getAllTeams = async (_req, res, next) => {
    try {
      const teams = await this.teamService.getAllTeams();
      res.status(200).json({ status: 'success', data: teams });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a team by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  getTeamById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const team = await this.teamService.getTeamById(id);

      if (!team) {
        const notFoundError = createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND, 404);
        return next(notFoundError);
      }

      res.status(200).json({ status: 'success', data: team });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  createTeam = async (req, res, next) => {
    try {
      const teamData = req.body;
      const newTeam = await this.teamService.createTeam(teamData);
      res
        .status(201)
        .json({ status: 'success', message: 'Team created successfully', data: newTeam });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  updateTeam = async (req, res, next) => {
    try {
      const { id } = req.params;
      const teamData = req.body;

      const updatedTeam = await this.teamService.updateTeam(id, teamData);

      if (!updatedTeam) {
        const notFoundError = createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND, 404);
        return next(notFoundError);
      }

      res
        .status(200)
        .json({ status: 'success', message: 'Team updated successfully', data: updatedTeam });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  deleteTeam = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await this.teamService.deleteTeam(id);

      if (!deleted) {
        const notFoundError = createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND, 404);
        return next(notFoundError);
      }

      res.status(200).json({ status: 'success', message: 'Team deleted successfully', data: null });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add a member to a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  addMember = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const updatedTeam = await this.teamService.addMember(id, userId);

      if (!updatedTeam) {
        const notFoundError = createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND, 404);
        return next(notFoundError);
      }

      res
        .status(200)
        .json({ status: 'success', message: 'Member added successfully', data: updatedTeam });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove a member from a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  removeMember = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const updatedTeam = await this.teamService.removeMember(id, userId);

      if (!updatedTeam) {
        const notFoundError = createError('Team not found', API_ERROR_CODES.TEAM_NOT_FOUND, 404);
        return next(notFoundError);
      }

      res
        .status(200)
        .json({ status: 'success', message: 'Member removed successfully', data: updatedTeam });
    } catch (error) {
      next(error);
    }
  };
}
