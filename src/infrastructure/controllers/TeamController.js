/** @typedef {import('express').Response} Response */

import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
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
  async getAllTeams(req, res, next) {
    try {
      const teams = await this.teamService.getAllTeams();

      // Structure according to new API
      return res.status(HTTP_STATUS.OK).apiSuccess(teams, 'Equipos obtenidos exitosamente');
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

      if (!team) {
        // Use RESOURCE_NOT_FOUND according to Swagger pattern
        const notFoundError = createError(
          'El equipo solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to new API
      return res.status(HTTP_STATUS.OK).apiSuccess(team, 'Equipo obtenido exitosamente');
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

      // Structure according to new API
      return res.status(HTTP_STATUS.CREATED).apiSuccess(newTeam, 'Equipo creado exitosamente');
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

      if (!updatedTeam) {
        // Use RESOURCE_NOT_FOUND according to Swagger pattern
        const notFoundError = createError(
          'El equipo solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to new API
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedTeam, 'Equipo actualizado exitosamente');
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
      const deleted = await this.teamService.deleteTeam(id);

      if (!deleted) {
        // Use RESOURCE_NOT_FOUND according to Swagger pattern
        const notFoundError = createError(
          'El equipo solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to new API: data null
      return res.status(HTTP_STATUS.OK).apiSuccess(null, 'Equipo eliminado exitosamente');
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

      if (!updatedTeam) {
        // Use RESOURCE_NOT_FOUND according to Swagger pattern
        const notFoundError = createError(
          'El equipo solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to new API
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedTeam, 'Miembro agregado exitosamente');
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

      if (!updatedTeam) {
        // Use RESOURCE_NOT_FOUND according to Swagger pattern
        const notFoundError = createError(
          'El equipo solicitado no existe',
          API_ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return next(notFoundError);
      }

      // Structure according to new API
      return res.status(HTTP_STATUS.OK).apiSuccess(updatedTeam, 'Miembro removido exitosamente');
    } catch (error) {
      next(error);
    }
  }
}
