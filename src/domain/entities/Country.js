/**
 * @typedef {Object} Country
 * @property {string} id - Unique country ID
 * @property {string} name - Country name
 * @property {string} code - Country code
 */

export class Country {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.code
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
  }

  /**
   * Convert country to plain object
   * @returns {Object} Plain object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
    };
  }
}
