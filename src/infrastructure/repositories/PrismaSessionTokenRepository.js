import { PrismaClient } from '@prisma/client';

/**
 * @implements {import('../../domain/repositories/SessionTokenRepository.js').SessionTokenRepository}
 */
export class PrismaSessionTokenRepository {
  #prisma;

  constructor() {
    this.#prisma = new PrismaClient();
  }

  #toDomain(record) {
    if (!record) return null;
    return {
      id: record.id.toString(),
      userId: record.user_id.toString(),
      token: record.token,
      lastActivityAt: record.last_activity_at,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
    };
  }

  async create({ userId, token, lastActivityAt, expiresAt }) {
    const rec = await this.#prisma.sessionToken.create({
      data: {
        user_id: parseInt(userId),
        token,
        last_activity_at: lastActivityAt,
        expires_at: expiresAt,
      },
    });
    return this.#toDomain(rec);
  }

  async findByToken(token) {
    const rec = await this.#prisma.sessionToken.findUnique({ where: { token } });
    return this.#toDomain(rec);
  }

  async deleteById(id) {
    await this.#prisma.sessionToken.delete({ where: { id: parseInt(id) } });
  }

  async deleteByToken(token) {
    const { count } = await this.#prisma.sessionToken.deleteMany({ where: { token } });
    return count;
  }

  async update(id, data) {
    const rec = await this.#prisma.sessionToken.update({
      where: { id: parseInt(id) },
      data: {
        token: data.token,
        last_activity_at: data.lastActivityAt,
        expires_at: data.expiresAt,
      },
    });
    return this.#toDomain(rec);
  }
}
