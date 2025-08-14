export class ManagerController {
  constructor(managerService) {
    this.managerService = managerService;
  }

  /**
   * GET /api/manager/dashboard
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDashboard(_req, res, next) {
    try {
      const dashboard = await this.managerService.getDashboard();
      return res.apiSuccess(dashboard, 'Manager dashboard');
    } catch (error) {
      next(error);
    }
  }
}
