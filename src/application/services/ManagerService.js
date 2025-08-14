export class ManagerService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  /**
   * Return basic dashboard data. Extend with real KPIs as needed.
   */
  async getDashboard() {
    return {
      message: 'Manager dashboard',
      ts: new Date().toISOString(),
    };
  }
}
