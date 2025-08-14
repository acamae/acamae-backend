import { AdminService } from '../../../../src/application/services/AdminService.js';

describe('AdminService (unit)', () => {
  it('getStats returns basic metrics', async () => {
    const svc = new AdminService();
    const stats = await svc.getStats();
    expect(stats).toHaveProperty('users.total');
    expect(stats).toHaveProperty('teams.total');
    expect(stats).toHaveProperty('system.uptime');
  });
});
