import { createEnvMock } from './tests/__mocks__/environment.mock.js';

const passthru = (_req, _res, next) => next();

// Helper para devolver siempre un middleware válido
const middleware = () => passthru;

// No se puede cerrar sobre variables externas dentro del factory de jest.mock.
jest.mock('./src/infrastructure/config/environment.js', () => {
  // Importación dinámica dentro del factory para cumplir la restricción
  // eslint-disable-next-line global-require
  const { createEnvMock } = require('./tests/__mocks__/environment.mock.js');
  return createEnvMock();
});

// Mock global de express-rate-limit
jest.mock('express-rate-limit', () => {
  const mockRateLimit = () => (req, _res, next) => next();
  return {
    __esModule: true,
    default: mockRateLimit,
    rateLimit: mockRateLimit,
  };
});

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
