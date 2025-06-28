import { Team } from '../../../src/domain/entities/Team.js';

describe('Team entity', () => {
  it('maps constructor data correctly', () => {
    const now = new Date();
    const t = new Team({
      id: '1',
      userId: '2',
      name: 'Dev',
      tag: 'DEV',
      description: 'Team',
      createdAt: now,
      updatedAt: now,
    });
    expect(t.id).toBe('1');
    expect(t.userId).toBe('2');
    expect(t.tag).toBe('DEV');
  });
});
