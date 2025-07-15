/**
 * Team DTO definitions shared across application layer.
 */

/**
 * @typedef {Object} CreateTeamDto
 * @property {string} name - Team name
 * @property {string} tag - Team tag
 * @property {string} [logoFilename] - Team logo filename
 * @property {string} [description] - Team description
 */
export const CreateTeamDto = {};

/**
 * @typedef {Object} UpdateTeamDto
 * @property {string} [name] - Team name
 * @property {string} [tag] - Team tag
 * @property {string} [logoFilename] - Team logo filename
 * @property {string} [description] - Team description
 */
export const UpdateTeamDto = {};
