import { PrismaClient } from '@prisma/client';

/**
 * @typedef {import('../../domain/repositories/CountryRepository.js').Country} Country
 * @implements {import('../../domain/repositories/CountryRepository.js').CountryRepository}
 */
export class PrismaCountryRepository {
  /** @type {PrismaClient} */
  #prisma;

  constructor() {
    this.#prisma = new PrismaClient();
  }

  /**
   * @returns {Promise<Country[]>}
   */
  async findAll() {
    const rows = await this.#prisma.country.findMany({
      select: { code: true, name: true },
      orderBy: { name: 'asc' },
    });
    return rows;
  }
}
