import { escape } from 'html-escaper';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str) => {
  if (!str) return str;
  try {
    return sanitizeHtml(escape(str), {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}, // No attributes allowed
      disallowedTagsMode: 'recursiveEscape',
    }).trim();
  } catch (error) {
    // Fallback to basic HTML escaping if sanitize-html fails
    console.warn('sanitize-html failed, using fallback sanitization:', error);
    return escape(str).trim();
  }
};

/**
 * Sanitize an email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email) return email;
  return sanitizeString(email.toLowerCase());
};

/**
 * Sanitize a number
 * @param {string|number} num - Number to sanitize
 * @returns {number} Sanitized number
 */
export const sanitizeNumber = (num) => {
  if (num === undefined || num === null) return num;
  const parsed = Number(num);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Sanitize an object's string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Sanitize request data (body, query, params)
 * @param {import('express').Request} req - Express request
 * @returns {import('express').Request} Sanitized request
 */
export const sanitizeRequest = (req) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize body parameters
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    return req;
  } catch (error) {
    console.error('Error sanitizing request:', error);
    return req;
  }
};

/**
 * Sanitize response data
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
export const sanitizeResponse = (data) => {
  try {
    if (typeof data === 'string') {
      return sanitizeString(data);
    }
    if (typeof data === 'object' && data !== null) {
      return sanitizeObject(data);
    }
    return data;
  } catch (error) {
    console.error('Error sanitizing response:', error);
    return data;
  }
};
