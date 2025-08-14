/**
 * @typedef {import('../services/CountriesService.js').CountriesService} CountriesService
 * @typedef {import('../../domain/repositories/CountryRepository.js').CountryRepository} CountryRepository
 */

export class CountriesService {
  /**
   * @param {CountryRepository} countryRepository
   * @param {{ loadFromTzdb: () => Promise<{ countries: Array<{ code: string; name: string }>; mtime?: Date }> }} fallbacks
   */
  constructor(countryRepository, fallbacks) {
    this.countryRepository = countryRepository;
    this.fallbacks = fallbacks;
  }

  /**
   * List countries, preferring DB and falling back to tzdb-derived list.
   */
  async listCountries() {
    try {
      const rows = await this.countryRepository.findAll();
      if (Array.isArray(rows) && rows.length >= 0) {
        return { countries: rows };
      }
    } catch {
      // ignore and try fallback
    }

    // Fallback to tzdb-derived
    const fb = await this.fallbacks.loadFromTzdb();
    return { countries: fb.countries };
  }
}
