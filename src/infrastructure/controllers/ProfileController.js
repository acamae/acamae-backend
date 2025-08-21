import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export class ProfileController {
  constructor(profileService) {
    this.profileService = profileService;
  }

  /**
   * Get user profile
   */
  async getUserProfile(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.profileService.getUserProfile(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add game to user profile
   */
  async addGame(req, res, next) {
    try {
      const { id } = req.params;
      const { gameId } = req.body;
      const data = await this.profileService.addGame(id, gameId);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Game added to profile');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove game from user profile
   */
  async removeGame(req, res, next) {
    try {
      const { id } = req.params;
      const { gameId } = req.body;
      const data = await this.profileService.removeGame(id, gameId);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Game removed from profile');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Replace user availability
   */
  async replaceAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { timezone, windows } = req.body;
      const data = await this.profileService.replaceAvailability(id, { timezone, windows });
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Availability updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user availability
   */
  async getAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.profileService.getAvailability(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Availability retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user timezone
   */
  async getUserTimezone(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.profileService.getUserTimezone(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Timezones retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set user timezone
   */
  async setUserTimezone(req, res, next) {
    try {
      const { id } = req.params;
      const { timezone } = req.body;
      const data = await this.profileService.setUserTimezone(id, timezone);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Timezone updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user country
   */
  async getUserCountry(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.profileService.getUserCountry(id);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Country retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set user country
   */
  async setUserCountry(req, res, next) {
    try {
      const { id } = req.params;
      const { countryCode } = req.body;
      const data = await this.profileService.setUserCountry(id, countryCode);
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Country updated');
    } catch (error) {
      next(error);
    }
  }
}
