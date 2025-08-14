import { PrismaClient } from '@prisma/client';

/**
 * @typedef {import('../../domain/entities/Game.js').Game} Game
 * @implements {import('../../domain/repositories/GameRepository.js').GameRepository}
 */
export class PrismaGameRepository {
  /** @type {PrismaClient} */
  #prisma;

  constructor() {
    this.#prisma = new PrismaClient();
  }

  /**
   * @param {any} prismaGame
   * @returns {Game|null}
   */
  #toDomain(prismaGame) {
    if (!prismaGame) return null;
    return {
      id: prismaGame.id,
      code: prismaGame.code,
      nameCode: prismaGame.name_code,
      imageFilename: prismaGame.image_filename,
    };
  }

  /**
   * @returns {Promise<Game[]>}
   */
  async findAll() {
    const list = await this.#prisma.game.findMany({ orderBy: { id: 'asc' } });
    return list.map((g) => this.#toDomain(g)).filter(Boolean);
  }

  /**
   * @param {number|string} id
   * @returns {Promise<Game|null>}
   */
  async findById(id) {
    const game = await this.#prisma.game.findUnique({ where: { id: Number(id) } });
    return this.#toDomain(game);
  }

  /**
   * @param {string} code
   * @returns {Promise<Game|null>}
   */
  async findByCode(code) {
    const game = await this.#prisma.game.findUnique({ where: { code } });
    return this.#toDomain(game);
  }
}
