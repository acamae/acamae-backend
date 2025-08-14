/**
 * Country domain model
 * @typedef {{ code: string; name: string }} Country
 */

/**
 * @interface CountryRepository
 */
export class CountryRepository {
  /**
   * @returns {Promise<Country[]>}
   */
  async findAll() {
    throw new Error('Not implemented');
  }
}
