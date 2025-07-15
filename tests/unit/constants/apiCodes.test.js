import { API_ERROR_CODES, ERROR_MESSAGES } from '../../../src/shared/constants/apiCodes.js';

describe('API_ERROR_CODES', () => {
  describe('validation codes compatibility', () => {
    it('VALIDATION_ERROR should have a error message', () => {
      expect(ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR]).toBe('Validation error');
    });
  });

  describe('ERR_NETWORK availability', () => {
    it('should have ERR_NETWORK defined', () => {
      expect(API_ERROR_CODES.ERR_NETWORK).toBe('ERR_NETWORK');
      expect(ERROR_MESSAGES[API_ERROR_CODES.ERR_NETWORK]).toBe('Network error occurred');
    });
  });

  describe('core validation structure', () => {
    it('should have all required validation error codes', () => {
      const requiredCodes = [
        'VALIDATION_ERROR',
        'INVALID_INPUT',
        'MISSING_REQUIRED_FIELD',
        'INVALID_FORMAT',
        'INVALID_LENGTH',
        'INVALID_VALUE',
        'INVALID_JSON',
        'REQUEST_TOO_LARGE',
        'INVALID_SCHEMA',
      ];

      requiredCodes.forEach((code) => {
        expect(API_ERROR_CODES[code]).toBeDefined();
        expect(typeof API_ERROR_CODES[code]).toBe('string');
        expect(ERROR_MESSAGES[API_ERROR_CODES[code]]).toBeDefined();
      });
    });
  });
});
