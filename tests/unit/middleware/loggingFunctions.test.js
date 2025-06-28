// Mock winston transport to intercept logs (debe declararse antes de importar el módulo)
jest.mock('winston', () => {
  const push = jest.fn();
  const fakeLogger = {
    log: push,
    error: push,
    warn: push,
    info: push,
    debug: push,
    add: jest.fn(),
  };

  const createLogger = jest.fn(() => fakeLogger);

  return {
    __esModule: true,
    default: {
      createLogger,
      format: {
        combine: () => {},
        timestamp: () => {},
        errors: () => {},
        json: () => {},
        colorize: () => {},
        simple: () => {},
      },
      transports: { Console: function () {}, File: function () {} },
    },
  };
});

// Importar después de mockear
import winston from 'winston';

import {
  log,
  logDebug,
  logError,
  logInfo,
  logWarning,
} from '../../../src/infrastructure/middleware/logging.js';

describe('logging helper functions', () => {
  it('delegates to logger.log', () => {
    log('info', 'message', { a: 1 });
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.log).toHaveBeenCalled();
  });

  it('logError delegates to logger.error', () => {
    logError('oops', new Error('boom'));
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.error).toHaveBeenCalled();
  });

  it('logWarning delegates to logger.warn', () => {
    logWarning('warn');
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.warn).toHaveBeenCalled();
  });

  it('logInfo delegates to logger.info', () => {
    logInfo('info');
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.info).toHaveBeenCalled();
  });

  it('logDebug delegates to logger.debug', () => {
    logDebug('debug');
    const loggerInstance = winston.createLogger.mock.results[0].value;
    expect(loggerInstance.debug).toHaveBeenCalled();
  });
});
