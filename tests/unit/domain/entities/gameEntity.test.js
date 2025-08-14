import { __noopGameEntity } from '../../../../src/domain/entities/Game.js';

describe('Game entity typedef (smoke)', () => {
  it('noop should return null (executes module under coverage)', () => {
    expect(__noopGameEntity()).toBeNull();
  });
});
