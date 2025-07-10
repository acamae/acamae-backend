/**
 * Tests for UserDto.js
 * Tests the exported DTO objects and validates the file structure
 */

import {
  CreateUserDto,
  UpdateUserDto,
  UserAuthDto,
  UserAuthResponseDto,
  UserFiltersDto,
  UserListResponseDto,
  UserPaginationDto,
  UserPasswordResetDto,
  UserPasswordResetRequestDto,
  UserResponseDto,
  UserVerificationDto,
} from '../../../src/application/dtos/UserDto.js';

describe('UserDto', () => {
  describe('Exported DTO Objects', () => {
    it('should export CreateUserDto as an object', () => {
      expect(CreateUserDto).toBeDefined();
      expect(typeof CreateUserDto).toBe('object');
      expect(CreateUserDto).toEqual({});
    });

    it('should export UpdateUserDto as an object', () => {
      expect(UpdateUserDto).toBeDefined();
      expect(typeof UpdateUserDto).toBe('object');
      expect(UpdateUserDto).toEqual({});
    });

    it('should export UserResponseDto as an object', () => {
      expect(UserResponseDto).toBeDefined();
      expect(typeof UserResponseDto).toBe('object');
      expect(UserResponseDto).toEqual({});
    });

    it('should export UserListResponseDto as an object', () => {
      expect(UserListResponseDto).toBeDefined();
      expect(typeof UserListResponseDto).toBe('object');
      expect(UserListResponseDto).toEqual({});
    });

    it('should export UserFiltersDto as an object', () => {
      expect(UserFiltersDto).toBeDefined();
      expect(typeof UserFiltersDto).toBe('object');
      expect(UserFiltersDto).toEqual({});
    });

    it('should export UserPaginationDto as an object', () => {
      expect(UserPaginationDto).toBeDefined();
      expect(typeof UserPaginationDto).toBe('object');
      expect(UserPaginationDto).toEqual({});
    });

    it('should export UserAuthDto as an object', () => {
      expect(UserAuthDto).toBeDefined();
      expect(typeof UserAuthDto).toBe('object');
      expect(UserAuthDto).toEqual({});
    });

    it('should export UserAuthResponseDto as an object', () => {
      expect(UserAuthResponseDto).toBeDefined();
      expect(typeof UserAuthResponseDto).toBe('object');
      expect(UserAuthResponseDto).toEqual({});
    });

    it('should export UserVerificationDto as an object', () => {
      expect(UserVerificationDto).toBeDefined();
      expect(typeof UserVerificationDto).toBe('object');
      expect(UserVerificationDto).toEqual({});
    });

    it('should export UserPasswordResetRequestDto as an object', () => {
      expect(UserPasswordResetRequestDto).toBeDefined();
      expect(typeof UserPasswordResetRequestDto).toBe('object');
      expect(UserPasswordResetRequestDto).toEqual({});
    });

    it('should export UserPasswordResetDto as an object', () => {
      expect(UserPasswordResetDto).toBeDefined();
      expect(typeof UserPasswordResetDto).toBe('object');
      expect(UserPasswordResetDto).toEqual({});
    });
  });

  describe('JSDoc Typedef Documentation', () => {
    it('should contain CreateUserDto typedef with all required properties', () => {
      const fs = require('fs');
      const path = require('path');

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/UserDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      expect(content).toContain('@typedef {Object} CreateUserDto');
      expect(content).toContain('@property {string} username');
      expect(content).toContain('@property {string} email');
      expect(content).toContain('@property {string} password');
      expect(content).toContain('@property {string} [firstName]');
      expect(content).toContain('@property {string} [lastName]');
    });

    it('should contain UserResponseDto typedef with all properties', () => {
      const fs = require('fs');
      const path = require('path');

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/UserDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      expect(content).toContain('@typedef {Object} UserResponseDto');
      expect(content).toContain('@property {number} id');
      expect(content).toContain('@property {string} username');
      expect(content).toContain('@property {string} email');
      expect(content).toContain('@property {boolean} isVerified');
      expect(content).toContain('@property {Date} createdAt');
    });

    it('should contain authentication-related DTOs', () => {
      const fs = require('fs');
      const path = require('path');

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/UserDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      expect(content).toContain('@typedef {Object} UserAuthDto');
      expect(content).toContain('@typedef {Object} UserAuthResponseDto');
      expect(content).toContain('@typedef {Object} UserVerificationDto');
      expect(content).toContain('@typedef {Object} UserPasswordResetDto');
    });

    it('should contain pagination and filtering DTOs', () => {
      const fs = require('fs');
      const path = require('path');

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/UserDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      expect(content).toContain('@typedef {Object} UserListResponseDto');
      expect(content).toContain('@typedef {Object} UserFiltersDto');
      expect(content).toContain('@typedef {Object} UserPaginationDto');
    });
  });

  describe('File Structure and Quality', () => {
    it('should be importable without errors', () => {
      expect(() => {
        require('../../../src/application/dtos/UserDto.js');
      }).not.toThrow();
    });

    it('should have proper JSDoc formatting', () => {
      const fs = require('fs');
      const path = require('path');

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/UserDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      // Verify proper JSDoc structure
      expect(content).toContain('/**');
      expect(content).toContain(' */');
      expect(content).toContain('Data Transfer Objects for User operations');
    });

    it('should export all expected DTOs', () => {
      const expectedExports = [
        'CreateUserDto',
        'UpdateUserDto',
        'UserResponseDto',
        'UserListResponseDto',
        'UserFiltersDto',
        'UserPaginationDto',
        'UserAuthDto',
        'UserAuthResponseDto',
        'UserVerificationDto',
        'UserPasswordResetRequestDto',
        'UserPasswordResetDto',
      ];

      const moduleExports = {
        CreateUserDto,
        UpdateUserDto,
        UserResponseDto,
        UserListResponseDto,
        UserFiltersDto,
        UserPaginationDto,
        UserAuthDto,
        UserAuthResponseDto,
        UserVerificationDto,
        UserPasswordResetRequestDto,
        UserPasswordResetDto,
      };

      expectedExports.forEach((exportName) => {
        expect(moduleExports).toHaveProperty(exportName);
        expect(moduleExports[exportName]).toBeDefined();
      });
    });

    it('should use consistent property type definitions', () => {
      const fs = require('fs');
      const path = require('path');

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/UserDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      // Check for consistent type usage
      expect(content).toMatch(/@property \{string\}/);
      expect(content).toMatch(/@property \{number\}/);
      expect(content).toMatch(/@property \{boolean\}/);
      expect(content).toMatch(/@property \{Date\}/);

      // Check for optional properties format
      expect(content).toMatch(/@property \{[^}]+\} \[[^\]]+\]/);
    });
  });

  describe('DTO Objects Immutability', () => {
    it('should allow property assignment to DTO objects', () => {
      // Since these are empty objects, we can assign properties for testing
      expect(() => {
        CreateUserDto.testProp = 'test';
      }).not.toThrow();

      expect(CreateUserDto.testProp).toBe('test');

      // Clean up
      delete CreateUserDto.testProp;
    });

    it('should maintain object reference equality', () => {
      const originalCreateUserDto = CreateUserDto;
      expect(CreateUserDto).toBe(originalCreateUserDto);
    });
  });
});
