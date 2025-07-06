import { API_ERROR_CODES, ERROR_MESSAGES } from '../../../src/shared/constants/apiCodes.js';

describe('API_ERROR_CODES', () => {
  describe('validation codes compatibility', () => {
    it('VALIDATION_ERROR and VALIDATION_FAILED should point to the same value', () => {
      expect(API_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(API_ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_ERROR');
      expect(API_ERROR_CODES.VALIDATION_ERROR).toBe(API_ERROR_CODES.VALIDATION_FAILED);
    });

    it('VALIDATION_ERROR and VALIDATION_FAILED should have the same error message', () => {
      expect(ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR]).toBe('Validation error');
      expect(ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_FAILED]).toBe('Validation error');
      expect(ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR]).toBe(
        ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_FAILED]
      );
    });

    it('both codes should be defined', () => {
      expect(API_ERROR_CODES.VALIDATION_ERROR).toBeDefined();
      expect(API_ERROR_CODES.VALIDATION_FAILED).toBeDefined();
    });

    it('should maintain backward compatibility', () => {
      // Verificar que ambos códigos pueden usarse indistintamente
      const errorWithValidationError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR],
      };

      const errorWithValidationFailed = {
        code: API_ERROR_CODES.VALIDATION_FAILED,
        message: ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_FAILED],
      };

      expect(errorWithValidationError.code).toBe(errorWithValidationFailed.code);
      expect(errorWithValidationError.message).toBe(errorWithValidationFailed.message);
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
        'VALIDATION_FAILED',
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
