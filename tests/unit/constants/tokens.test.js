import { TOKEN_TYPES } from '../../../src/shared/constants/tokens.js';

describe('TOKEN_TYPES constant', () => {
  it('contiene los tipos esperados', () => {
    expect(TOKEN_TYPES).toEqual({
      VERIFICATION: 'verification',
      RESET: 'reset',
      REFRESH: 'refresh',
      ACCESS: 'access',
    });
  });

  it('no expone tipos extraños', () => {
    const allowed = ['VERIFICATION', 'RESET', 'REFRESH', 'ACCESS'];
    expect(Object.keys(TOKEN_TYPES)).toEqual(allowed);
  });
});
