/**
 * @typedef {Object} Team
 * @property {string} id - Unique team ID
 * @property {string} userId - Owner user ID
 * @property {string} name - Team name
 * @property {string} tag - Team tag
 * @property {string} [logoFilename] - Team logo filename
 * @property {string} [description] - Team description
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 * @property {User} [user] - Owner user
 */

export class Team {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.userId
   * @param {string} data.name
   * @param {string} data.tag
   * @param {string} [data.logoFilename]
   * @param {string} [data.description]
   * @param {Date} data.createdAt
   * @param {Date} data.updatedAt
   * @param {User} [data.user]
   */
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.tag = data.tag;
    this.logoFilename = data.logoFilename;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.user = data.user;
  }
}
