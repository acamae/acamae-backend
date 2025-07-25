import { createEnvMock } from './tests/__mocks__/environment.mock.js';

const passthru = (_req, _res, next) => next();

// Helper para devolver siempre un middleware válido
const middleware = () => passthru;

// No se puede cerrar sobre variables externas dentro del factory de jest.mock.
jest.mock('./src/infrastructure/config/environment.js', () => {
  // Importación dinámica dentro del factory para cumplir la restricción
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

// Mock console methods globally to keep test output clean
// Se guarda una referencia a los métodos originales para poder restaurarlos
global.originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  trace: console.trace,
};

// Función para silenciar la consola globalmente
const silenceConsole = () => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
  console.trace = jest.fn();
};

// Función para restaurar la consola original
const restoreConsole = () => {
  console.log = global.originalConsole.log;
  console.info = global.originalConsole.info;
  console.warn = global.originalConsole.warn;
  console.error = global.originalConsole.error;
  console.debug = global.originalConsole.debug;
  console.trace = global.originalConsole.trace;
};

// Silenciar consola por defecto para todos los tests
beforeAll(() => {
  silenceConsole();
});

// Limpiar mocks entre tests para evitar interferencias
beforeEach(() => {
  // Solo reinicializar si los métodos son mocks de Jest
  if (jest.isMockFunction(console.log)) {
    console.log.mockClear();
  }
  if (jest.isMockFunction(console.info)) {
    console.info.mockClear();
  }
  if (jest.isMockFunction(console.warn)) {
    console.warn.mockClear();
  }
  if (jest.isMockFunction(console.error)) {
    console.error.mockClear();
  }
  if (jest.isMockFunction(console.debug)) {
    console.debug.mockClear();
  }
  if (jest.isMockFunction(console.trace)) {
    console.trace.mockClear();
  }
});

afterAll(() => {
  restoreConsole();
});

// Exportar funciones utilitarias para uso en tests específicos
global.silenceConsole = silenceConsole;
global.restoreConsole = restoreConsole;
