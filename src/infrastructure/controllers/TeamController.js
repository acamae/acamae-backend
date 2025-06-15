/** @typedef {import('express').Response} Response */

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';

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
  getAllTeams = async (_req, res) => {
    try {
      const teams = await this.teamService.getAllTeams();
      res.success(teams);
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Get a team by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  getTeamById = async (req, res) => {
    try {
      const { id } = req.params;
      const team = await this.teamService.getTeamById(id);

      if (!team) {
        return res.notFound('Equipo no encontrado', API_ERROR_CODES.TEAM_NOT_FOUND);
      }

      res.success(team);
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Create a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  createTeam = async (req, res) => {
    try {
      const teamData = req.body;
      const newTeam = await this.teamService.createTeam(teamData);
      res.success(newTeam, 'Equipo creado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Update a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  updateTeam = async (req, res) => {
    try {
      const { id } = req.params;
      const teamData = req.body;

      const updatedTeam = await this.teamService.updateTeam(id, teamData);

      if (!updatedTeam) {
        return res.notFound('Equipo no encontrado', API_ERROR_CODES.TEAM_NOT_FOUND);
      }

      res.success(updatedTeam, 'Equipo actualizado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Delete a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  deleteTeam = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.teamService.deleteTeam(id);

      if (!deleted) {
        return res.notFound('Equipo no encontrado', API_ERROR_CODES.TEAM_NOT_FOUND);
      }

      res.success(null, 'Equipo eliminado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Add a member to a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  addMember = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const updatedTeam = await this.teamService.addMember(id, userId);

      if (!updatedTeam) {
        return res.notFound('Equipo no encontrado', API_ERROR_CODES.TEAM_NOT_FOUND);
      }

      res.success(updatedTeam, 'Miembro agregado correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };

  /**
   * Remove a member from a team
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  removeMember = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const updatedTeam = await this.teamService.removeMember(id, userId);

      if (!updatedTeam) {
        return res.notFound('Equipo no encontrado', API_ERROR_CODES.TEAM_NOT_FOUND);
      }

      res.success(updatedTeam, 'Miembro removido correctamente');
    } catch (error) {
      res.error(error.message, API_ERROR_CODES.UNKNOWN_ERROR);
    }
  };
}
