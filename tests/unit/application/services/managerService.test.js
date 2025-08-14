import { ManagerService } from '../../../../src/application/services/ManagerService.js';

describe('ManagerService (unit)', () => {
  it('getDashboard returns payload with message and ts', async () => {
    const svc = new ManagerService();
    const data = await svc.getDashboard();
    expect(data).toHaveProperty('message', 'Manager dashboard');
    expect(typeof data.ts).toBe('string');
  });
});

