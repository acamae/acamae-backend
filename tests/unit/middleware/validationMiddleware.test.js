// Desactivar el mock global de validation.js
jest.unmock(require.resolve('../../../src/infrastructure/middleware/validation.js'));

const validationModule = require('../../../src/infrastructure/middleware/validation.js');

const { registerValidation, loginValidation } = validationModule;
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';

const buildReq = (body = {}) => ({ body });
const noopRes = {};
const buildNext = () => jest.fn();

describe('validation middleware', () => {
  it('passes valid register payload', () => {
    const req = buildReq({
      email: 'test@example.com',
      password: 'StrongP@ssw0rd',
      username: 'user_1',
    });
    const next = buildNext();
    registerValidation(req, noopRes, next);
    expect(next).toHaveBeenCalledWith();
    // Datos sanitizados (email lowercased, etc.)
    expect(req.body.email).toBe('test@example.com');
  });

  it('returns VALIDATION_ERROR on bad login data', () => {
    const req = buildReq({ email: 'not-an-email', password: 'short' });
    expect(() => {
      loginValidation(req, noopRes, jest.fn());
    }).toThrow();
  });
});
