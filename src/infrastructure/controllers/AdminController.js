export class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  /**
   * GET /api/admin/stats
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getStats(_req, res, next) {
    try {
      const stats = await this.adminService.getStats();
      return res.apiSuccess(stats, 'Admin stats');
    } catch (error) {
      next(error);
    }
  }
}
