import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export class TimezonesController {
  /**
   * @param {{ env: string }} config
   * @param {{ load?: () => Promise<{ json: any; mtime?: Date }> }} [deps]
   */
  constructor(config, deps = {}) {
    this.config = config;
    this.loader = typeof deps.load === 'function' ? deps.load : null;
  }

  /**
   * GET /api/timezones
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getTimezones(_req, res, next) {
    try {
      // If cache middleware populated locals, reuse it
      const data = res.locals.__cacheJson;
      if (data) {
        return res.status(HTTP_STATUS.OK).apiSuccess(data, 'Timezones catalog');
      }

      // Use injected loader if provided (for tests or custom sources)
      if (this.loader) {
        const { json, mtime } = await this.loader();
        if (mtime instanceof Date) {
          res.set('Last-Modified', mtime.toUTCString());
        }
        return res.status(HTTP_STATUS.OK).apiSuccess(json, 'Timezones catalog');
      }

      // Fallback: load inline if middleware not used
      const { readFile, stat } = await import('fs/promises');
      const path = (await import('path')).default;
      const filePath = path.resolve(
        process.cwd(),
        'src',
        'infrastructure',
        'assets',
        'timezones.json'
      );
      const raw = await readFile(filePath, 'utf-8');
      const json = JSON.parse(raw);
      const fileStat = await stat(filePath);
      res.set('Last-Modified', fileStat.mtime.toUTCString());
      return res.status(HTTP_STATUS.OK).apiSuccess(json, 'Timezones catalog');
    } catch (error) {
      return res.apiError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        API_ERROR_CODES.SERVICE_UNAVAILABLE,
        'Timezones catalog not available',
        {
          type: 'server',
          details: [
            { field: 'timezones', code: HTTP_STATUS.SERVICE_UNAVAILABLE, message: error.message },
          ],
        }
      );
    }
  }
}
