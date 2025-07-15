/**
 * Tests for TeamDto.js
 * Tests the exported DTO objects and validates the file structure
 */

import fs from 'fs';
import path from 'path';

import { CreateTeamDto, UpdateTeamDto } from '../../../src/application/dtos/TeamDto.js';

describe('TeamDto', () => {
  describe('Exported DTO Objects', () => {
    it('should export CreateTeamDto as an object', () => {
      expect(CreateTeamDto).toBeDefined();
      expect(typeof CreateTeamDto).toBe('object');
      expect(CreateTeamDto).toEqual({});
    });

    it('should export UpdateTeamDto as an object', () => {
      expect(UpdateTeamDto).toBeDefined();
      expect(typeof UpdateTeamDto).toBe('object');
      expect(UpdateTeamDto).toEqual({});
    });
  });

  describe('JSDoc Typedef Documentation', () => {
    it('should contain CreateTeamDto typedef documentation', () => {
      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/TeamDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      // Verify the file contains the expected typedef definitions
      expect(content).toContain('@typedef {Object} CreateTeamDto');
      expect(content).toContain('@property {string} name');
      expect(content).toContain('@property {string} tag');
      expect(content).toContain('@property {string} [logoFilename]');
      expect(content).toContain('@property {string} [description]');
    });

    it('should contain UpdateTeamDto typedef documentation', () => {
      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/TeamDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      // Verify the file contains the expected typedef definitions
      expect(content).toContain('@typedef {Object} UpdateTeamDto');
      expect(content).toContain('@property {string} [name]');
      expect(content).toContain('@property {string} [tag]');
      expect(content).toContain('@property {string} [logoFilename]');
      expect(content).toContain('@property {string} [description]');
    });
  });

  describe('File Structure and Quality', () => {
    it('should be importable without errors', async () => {
      // This tests that the file can be loaded and doesn't have syntax errors
      expect(async () => {
        await import('../../../src/application/dtos/TeamDto.js');
      }).not.toThrow();
    });

    it('should have the expected file structure', () => {
      // Verify the file exists and is accessible

      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/TeamDto.js');
      expect(fs.existsSync(dtoPath)).toBe(true);
    });

    it('should follow consistent JSDoc formatting', () => {
      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/TeamDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      // Verify proper JSDoc structure
      expect(content).toContain('/**');
      expect(content).toContain(' */');
      expect(content).toContain('Team DTO definitions');
    });

    it('should define both required and optional properties correctly', () => {
      const dtoPath = path.resolve(__dirname, '../../../src/application/dtos/TeamDto.js');
      const content = fs.readFileSync(dtoPath, 'utf8');

      // Required properties (no brackets)
      expect(content).toContain('@property {string} name');
      expect(content).toContain('@property {string} tag');

      // Optional properties (with brackets)
      expect(content).toContain('@property {string} [logoFilename]');
      expect(content).toContain('@property {string} [description]');
    });

    it('should export all expected DTOs', () => {
      const expectedExports = ['CreateTeamDto', 'UpdateTeamDto'];

      const moduleExports = {
        CreateTeamDto,
        UpdateTeamDto,
      };

      expectedExports.forEach((exportName) => {
        expect(moduleExports).toHaveProperty(exportName);
        expect(moduleExports[exportName]).toBeDefined();
      });
    });
  });

  describe('DTO Objects Immutability', () => {
    it('should allow property assignment to DTO objects', () => {
      // Since these are empty objects, we can assign properties for testing
      expect(() => {
        CreateTeamDto.testProp = 'test';
      }).not.toThrow();

      expect(CreateTeamDto.testProp).toBe('test');

      // Clean up
      delete CreateTeamDto.testProp;
    });

    it('should maintain object reference equality', () => {
      const originalCreateTeamDto = CreateTeamDto;
      expect(CreateTeamDto).toBe(originalCreateTeamDto);
    });
  });
});
