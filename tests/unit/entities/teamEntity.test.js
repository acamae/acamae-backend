import { Team } from '../../../src/domain/entities/Team.js';
import { ERROR_MESSAGES } from '../../../src/shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../../src/shared/constants/httpStatus.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';

describe('Team entity', () => {
  let validTeamData;

  beforeEach(() => {
    validTeamData = {
      id: '1',
      userId: '2',
      name: 'Development Team',
      tag: 'DEV',
      description: 'A team for development',
      logoFilename: 'logo.png',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: '2', name: 'John Doe' },
    };
  });

  describe('constructor', () => {
    it('should map constructor data correctly', () => {
      const now = new Date();
      const team = new Team({
        id: '1',
        userId: '2',
        name: 'Dev',
        tag: 'DEV',
        description: 'Team',
        createdAt: now,
        updatedAt: now,
      });

      expect(team.id).toBe('1');
      expect(team.userId).toBe('2');
      expect(team.name).toBe('Dev');
      expect(team.tag).toBe('DEV');
      expect(team.description).toBe('Team');
      expect(team.createdAt).toBe(now);
      expect(team.updatedAt).toBe(now);
    });

    it('should handle optional fields', () => {
      const team = new Team({
        id: '1',
        userId: '2',
        name: 'Dev',
        tag: 'DEV',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(team.logoFilename).toBeUndefined();
      expect(team.description).toBeUndefined();
      expect(team.user).toBeUndefined();
    });

    it('should handle all fields', () => {
      const team = new Team(validTeamData);

      expect(team.id).toBe(validTeamData.id);
      expect(team.userId).toBe(validTeamData.userId);
      expect(team.name).toBe(validTeamData.name);
      expect(team.tag).toBe(validTeamData.tag);
      expect(team.description).toBe(validTeamData.description);
      expect(team.logoFilename).toBe(validTeamData.logoFilename);
      expect(team.createdAt).toBe(validTeamData.createdAt);
      expect(team.updatedAt).toBe(validTeamData.updatedAt);
      expect(team.user).toBe(validTeamData.user);
    });
  });

  describe('validate', () => {
    it('should validate correct team data', () => {
      const team = new Team(validTeamData);
      expect(() => team.validate()).not.toThrow();
    });

    it('should throw error when name is missing', () => {
      const teamData = { ...validTeamData, name: '' };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
          code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: expect.objectContaining({
            type: 'business',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                code: 'REQUIRED',
                message: 'Team name is required',
              }),
            ]),
          }),
        })
      );
    });

    it('should throw error when name is null', () => {
      const teamData = { ...validTeamData, name: null };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
    });

    it('should throw error when name is undefined', () => {
      const teamData = { ...validTeamData, name: undefined };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
    });

    it('should throw error when name is too short', () => {
      const teamData = { ...validTeamData, name: 'A' };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_LENGTH],
          code: API_ERROR_CODES.TEAM_NAME_LENGTH,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: expect.objectContaining({
            type: 'business',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                code: 'LENGTH',
                message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_LENGTH],
              }),
            ]),
          }),
        })
      );
    });

    it('should throw error when name is too long', () => {
      const longName = 'A'.repeat(51); // Assuming MAX_TEAM_NAME_LENGTH is 50
      const teamData = { ...validTeamData, name: longName };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_NAME_LENGTH],
          code: API_ERROR_CODES.TEAM_NAME_LENGTH,
          status: HTTP_STATUS.BAD_REQUEST,
        })
      );
    });

    it('should throw error when tag is missing', () => {
      const teamData = { ...validTeamData, tag: '' };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.MISSING_REQUIRED_FIELD],
          code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: expect.objectContaining({
            type: 'business',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'tag',
                code: 'REQUIRED',
                message: 'Team tag is required',
              }),
            ]),
          }),
        })
      );
    });

    it('should throw error when tag is null', () => {
      const teamData = { ...validTeamData, tag: null };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
    });

    it('should throw error when tag is undefined', () => {
      const teamData = { ...validTeamData, tag: undefined };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
    });

    it('should throw error when tag is too short', () => {
      const teamData = { ...validTeamData, tag: 'A' };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_LENGTH],
          code: API_ERROR_CODES.TEAM_TAG_LENGTH,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: expect.objectContaining({
            type: 'business',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'tag',
                code: 'LENGTH',
                message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_LENGTH],
              }),
            ]),
          }),
        })
      );
    });

    it('should throw error when tag is too long', () => {
      const longTag = 'A'.repeat(11); // Assuming MAX_TEAM_TAG_LENGTH is 10
      const teamData = { ...validTeamData, tag: longTag };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_TAG_LENGTH],
          code: API_ERROR_CODES.TEAM_TAG_LENGTH,
          status: HTTP_STATUS.BAD_REQUEST,
        })
      );
    });

    it('should throw error when description is too long', () => {
      const longDescription = 'A'.repeat(501); // Assuming MAX_TEAM_DESCRIPTION_LENGTH is 500
      const teamData = { ...validTeamData, description: longDescription };
      const team = new Team(teamData);

      expect(() => team.validate()).toThrow();
      expect(() => team.validate()).toThrow(
        expect.objectContaining({
          message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_DESCRIPTION_LENGTH],
          code: API_ERROR_CODES.TEAM_DESCRIPTION_LENGTH,
          status: HTTP_STATUS.BAD_REQUEST,
          errorDetails: expect.objectContaining({
            type: 'business',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'description',
                code: 'LENGTH',
                message: ERROR_MESSAGES[API_ERROR_CODES.TEAM_DESCRIPTION_LENGTH],
              }),
            ]),
          }),
        })
      );
    });

    it('should validate team with valid description', () => {
      const teamData = { ...validTeamData, description: 'A valid description' };
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team without description', () => {
      const teamData = { ...validTeamData, description: undefined };
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with empty description', () => {
      const teamData = { ...validTeamData, description: '' };
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with null description', () => {
      const teamData = { ...validTeamData, description: null };
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with minimum valid name length', () => {
      const teamData = { ...validTeamData, name: 'AB' }; // Assuming MIN_TEAM_NAME_LENGTH is 2
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with maximum valid name length', () => {
      const teamData = { ...validTeamData, name: 'A'.repeat(50) }; // Assuming MAX_TEAM_NAME_LENGTH is 50
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with minimum valid tag length', () => {
      const teamData = { ...validTeamData, tag: 'AB' }; // Assuming MIN_TEAM_TAG_LENGTH is 2
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with maximum valid tag length', () => {
      const teamData = { ...validTeamData, tag: 'A'.repeat(10) }; // Assuming MAX_TEAM_TAG_LENGTH is 10
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should validate team with maximum valid description length', () => {
      const teamData = { ...validTeamData, description: 'A'.repeat(500) }; // Assuming MAX_TEAM_DESCRIPTION_LENGTH is 500
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle team with only required fields', () => {
      const minimalTeamData = {
        id: '1',
        userId: '2',
        name: 'Dev',
        tag: 'DEV',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const team = new Team(minimalTeamData);
      expect(() => team.validate()).not.toThrow();
    });

    it('should handle team with whitespace in name', () => {
      const teamData = { ...validTeamData, name: '   Dev Team   ' };
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });

    it('should handle team with whitespace in tag', () => {
      const teamData = { ...validTeamData, tag: '   DEV   ' };
      const team = new Team(teamData);

      expect(() => team.validate()).not.toThrow();
    });
  });
});
