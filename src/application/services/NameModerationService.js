import axios from 'axios';

import { config } from '../../infrastructure/config/environment.js';

/**
 * Service for moderating user names using AI-powered content analysis
 * Uses Google's Perspective API to detect inappropriate or offensive names
 */
export class NameModerationService {
  constructor() {
    this.apiKey = config.perspective?.apiKey;
    this.baseUrl = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
    this.enabled = !!this.apiKey;
  }

  /**
   * Check if a name is inappropriate or offensive
   * @param {string} name - The name to check
   * @returns {Promise<boolean>} - True if name is inappropriate
   */
  async isInappropriateName(name) {
    if (!this.enabled) {
      console.warn(
        'NameModerationService: Perspective API key not configured, skipping moderation'
      );
      return false;
    }

    try {
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        comment: { text: name },
        requestedAttributes: {
          TOXICITY: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
          SEXUALLY_EXPLICIT: {},
        },
        languages: ['es', 'en'], // Support Spanish and English
      });

      const scores = response.data.attributeScores;

      // Check various toxicity indicators
      const toxicity = scores.TOXICITY?.summaryScore?.value || 0;
      const insult = scores.INSULT?.summaryScore?.value || 0;
      const profanity = scores.PROFANITY?.summaryScore?.value || 0;
      const threat = scores.THREAT?.summaryScore?.value || 0;
      const sexuallyExplicit = scores.SEXUALLY_EXPLICIT?.summaryScore?.value || 0;

      // Configurable thresholds (70% confidence)
      const threshold = config.perspective?.threshold || 0.7;

      const isInappropriate =
        toxicity > threshold ||
        insult > threshold ||
        profanity > threshold ||
        threat > threshold ||
        sexuallyExplicit > threshold;

      if (isInappropriate) {
        console.log(`Name moderation: "${name}" flagged as inappropriate`, {
          toxicity: Math.round(toxicity * 100),
          insult: Math.round(insult * 100),
          profanity: Math.round(profanity * 100),
          threat: Math.round(threat * 100),
          sexuallyExplicit: Math.round(sexuallyExplicit * 100),
        });
      }

      return isInappropriate;
    } catch (error) {
      console.error('NameModerationService: Error checking name moderation:', error.message);

      // In case of API error, log but don't block the name
      // This prevents service outages from breaking user registration
      return false;
    }
  }

  /**
   * Check if a full name combination is inappropriate
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {Promise<boolean>} - True if name combination is inappropriate
   */
  async isInappropriateFullName(firstName, lastName) {
    const fullName = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
    return this.isInappropriateName(fullName);
  }

  /**
   * Check if a username is inappropriate
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - True if username is inappropriate
   */
  async isInappropriateUsername(username) {
    return this.isInappropriateName(username);
  }

  /**
   * Get moderation status and scores for debugging
   * @param {string} name - Name to analyze
   * @returns {Promise<Object>} - Detailed moderation results
   */
  async getModerationDetails(name) {
    if (!this.enabled) {
      return { enabled: false, inappropriate: false };
    }

    try {
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        comment: { text: name },
        requestedAttributes: {
          TOXICITY: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
          SEXUALLY_EXPLICIT: {},
        },
        languages: ['es', 'en'],
      });

      const scores = response.data.attributeScores;
      const threshold = config.perspective?.threshold || 0.7;

      return {
        enabled: true,
        name,
        scores: {
          toxicity: Math.round((scores.TOXICITY?.summaryScore?.value || 0) * 100),
          insult: Math.round((scores.INSULT?.summaryScore?.value || 0) * 100),
          profanity: Math.round((scores.PROFANITY?.summaryScore?.value || 0) * 100),
          threat: Math.round((scores.THREAT?.summaryScore?.value || 0) * 100),
          sexuallyExplicit: Math.round((scores.SEXUALLY_EXPLICIT?.summaryScore?.value || 0) * 100),
        },
        threshold: Math.round(threshold * 100),
        inappropriate: this._isInappropriate(scores, threshold),
      };
    } catch (error) {
      return {
        enabled: true,
        error: error.message,
        inappropriate: false,
      };
    }
  }

  /**
   * Check if scores indicate inappropriate content
   * @param {Object} scores - Perspective API scores
   * @param {number} threshold - Threshold for flagging
   * @returns {boolean} - True if any score exceeds threshold
   * @private
   */
  _isInappropriate(scores, threshold) {
    return (
      (scores.TOXICITY?.summaryScore?.value || 0) > threshold ||
      (scores.INSULT?.summaryScore?.value || 0) > threshold ||
      (scores.PROFANITY?.summaryScore?.value || 0) > threshold ||
      (scores.THREAT?.summaryScore?.value || 0) > threshold ||
      (scores.SEXUALLY_EXPLICIT?.summaryScore?.value || 0) > threshold
    );
  }
}

// Export singleton instance
export const nameModerationService = new NameModerationService();
