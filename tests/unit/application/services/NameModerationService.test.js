import { jest } from '@jest/globals';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock config
jest.mock('../../../../src/infrastructure/config/environment.js', () => ({
  config: {
    perspective: {
      apiKey: 'test-api-key',
      threshold: 0.7,
    },
  },
}));

import { NameModerationService } from '../../../../src/application/services/NameModerationService.js';

describe('NameModerationService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NameModerationService();
  });

  describe('constructor', () => {
    it('should initialize with API key when available', () => {
      expect(service.apiKey).toBe('test-api-key');
      expect(service.enabled).toBe(true);
    });

    it('should disable service when no API key', async () => {
      jest.resetModules();
      jest.doMock('../../../../src/infrastructure/config/environment.js', () => ({
        config: { perspective: null },
      }));
      const { NameModerationService: DisabledService } = await import(
        '../../../../src/application/services/NameModerationService.js'
      );
      const disabledService = new DisabledService();
      expect(disabledService.enabled).toBe(false);
    });
  });

  describe('isInappropriateName', () => {
    it('should return false when service is disabled', async () => {
      service.enabled = false;
      const result = await service.isInappropriateName('test name');
      expect(result).toBe(false);
    });

    it('should detect inappropriate names', async () => {
      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.8 } },
            INSULT: { summaryScore: { value: 0.3 } },
            PROFANITY: { summaryScore: { value: 0.2 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await service.isInappropriateName('inappropriate name');

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('commentanalyzer.googleapis.com'),
        expect.objectContaining({
          comment: { text: 'inappropriate name' },
          requestedAttributes: expect.any(Object),
          languages: ['es', 'en'],
        })
      );
    });

    it('should allow appropriate names', async () => {
      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.1 } },
            INSULT: { summaryScore: { value: 0.2 } },
            PROFANITY: { summaryScore: { value: 0.1 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await service.isInappropriateName('John Doe');

      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const result = await service.isInappropriateName('test name');

      expect(result).toBe(false);
    });

    it('should use custom threshold when configured', async () => {
      service = new NameModerationService();
      service.apiKey = 'test-key';
      service.enabled = true;

      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.5 } },
            INSULT: { summaryScore: { value: 0.3 } },
            PROFANITY: { summaryScore: { value: 0.2 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await service.isInappropriateName('test name');

      // With threshold 0.7, toxicity 0.5 should not be flagged
      expect(result).toBe(false);
    });
  });

  describe('isInappropriateFullName', () => {
    it('should check full name combination', async () => {
      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.1 } },
            INSULT: { summaryScore: { value: 0.1 } },
            PROFANITY: { summaryScore: { value: 0.1 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await service.isInappropriateFullName('John', 'Doe');

      expect(result).toBe(false);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('commentanalyzer.googleapis.com'),
        expect.objectContaining({
          comment: { text: 'John Doe' },
          requestedAttributes: expect.any(Object),
          languages: ['es', 'en'],
        })
      );
    });

    it('should trim whitespace from full name', async () => {
      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.1 } },
            INSULT: { summaryScore: { value: 0.1 } },
            PROFANITY: { summaryScore: { value: 0.1 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      await service.isInappropriateFullName('  John  ', '  Doe  ');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('commentanalyzer.googleapis.com'),
        expect.objectContaining({
          comment: { text: 'John Doe' },
          requestedAttributes: expect.any(Object),
          languages: ['es', 'en'],
        })
      );
    });
  });

  describe('isInappropriateUsername', () => {
    it('should check username', async () => {
      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.1 } },
            INSULT: { summaryScore: { value: 0.1 } },
            PROFANITY: { summaryScore: { value: 0.1 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await service.isInappropriateUsername('johndoe');

      expect(result).toBe(false);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('commentanalyzer.googleapis.com'),
        expect.objectContaining({
          comment: { text: 'johndoe' },
          requestedAttributes: expect.any(Object),
          languages: ['es', 'en'],
        })
      );
    });
  });

  describe('getModerationDetails', () => {
    it('should return detailed moderation results', async () => {
      const mockResponse = {
        data: {
          attributeScores: {
            TOXICITY: { summaryScore: { value: 0.8 } },
            INSULT: { summaryScore: { value: 0.3 } },
            PROFANITY: { summaryScore: { value: 0.2 } },
            THREAT: { summaryScore: { value: 0.1 } },
            SEXUALLY_EXPLICIT: { summaryScore: { value: 0.1 } },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await service.getModerationDetails('inappropriate name');

      expect(result).toEqual({
        enabled: true,
        name: 'inappropriate name',
        scores: {
          toxicity: 80,
          insult: 30,
          profanity: 20,
          threat: 10,
          sexuallyExplicit: 10,
        },
        threshold: 70,
        inappropriate: true,
      });
    });

    it('should return disabled status when no API key', async () => {
      service.enabled = false;

      const result = await service.getModerationDetails('test name');

      expect(result).toEqual({
        enabled: false,
        inappropriate: false,
      });
    });

    it('should handle API errors in details', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const result = await service.getModerationDetails('test name');

      expect(result).toEqual({
        enabled: true,
        error: 'API Error',
        inappropriate: false,
      });
    });
  });
});
