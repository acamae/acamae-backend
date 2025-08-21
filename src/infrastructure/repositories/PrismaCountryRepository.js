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
   * @param {any} prismaCountry
   * @returns {Country|null}
   */
  #toDomain(prismaCountry) {
    if (!prismaCountry) return null;
    return {
      id: prismaCountry.id,
      code: prismaCountry.code,
      name: prismaCountry.name,
    };
  }

  /**
   * @returns {Promise<Country[]>}
   */
  async findAll() {
    const list = await this.#prisma.country.findMany({
      select: { code: true, name: true },
      orderBy: { name: 'asc' },
    });
    return list.map((country) => this.#toDomain(country)).filter(Boolean);
  }
}
