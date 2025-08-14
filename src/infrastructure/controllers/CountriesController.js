import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export class CountriesController {
  constructor(service) {
    this.service = service;
  }

  /**
   * GET /api/countries
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getCountries(_req, res, next) {
    try {
      // If cache middleware populated JSON, use it directly to avoid recomputation
      if (Array.isArray(res.locals.__cacheJson?.countries)) {
        return res.status(HTTP_STATUS.OK).apiSuccess(res.locals.__cacheJson, 'Countries catalog');
      }

      const data = await this.service.listCountries();
      return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Countries catalog');
    } catch (error) {
      return res.apiError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        API_ERROR_CODES.SERVICE_UNAVAILABLE,
        'Countries catalog not available',
        {
          type: 'server',
          details: [
            { field: 'countries', code: HTTP_STATUS.SERVICE_UNAVAILABLE, message: error.message },
          ],
        }
      );
    }
  }
}
