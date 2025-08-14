export class AdminService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  /**
   * Aggregate platform stats. Can be extended to query repositories/metrics.
   */
  async getStats() {
    return {
      users: { total: 0 },
      teams: { total: 0 },
      system: { uptime: process.uptime() },
    };
  }
}
