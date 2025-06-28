import { SessionTokenRepository } from '../../../src/domain/repositories/SessionTokenRepository.js';
import { TeamRepository } from '../../../src/domain/repositories/TeamRepository.js';
import { UserRepository } from '../../../src/domain/repositories/UserRepository.js';

/**
 * Dado que las interfaces del dominio aún no están implementadas, nos aseguramos
 * de que todos los métodos estándar lancen el error esperado. Esto evita que
 * se utilicen accidentalmente en producción sin implementar y mantiene la
 * cobertura de código adecuada.
 */

describe('Domain repository interfaces', () => {
  const errorMsg = 'Method not implemented';

  describe('UserRepository', () => {
    let repo;
    beforeEach(() => {
      repo = new UserRepository();
    });

    const calls = [
      () => repo.findById('1'),
      () => repo.findByEmail('a@b.com'),
      () => repo.findByUsername('usr'),
      () => repo.create({}),
      () => repo.update('1', {}),
      () => repo.delete('1'),
      () => repo.findAll(),
      () => repo.findByVerificationToken('tok'),
      () => repo.findByResetToken('tok'),
      () => repo.setVerificationToken('1', 'tok', new Date()),
      () => repo.setVerified('1', true),
      () => repo.setResetToken('1', 'tok', new Date()),
    ];

    it.each(calls.map((fn, idx) => [idx]))('método %i lanza error', async (idx) => {
      await expect(calls[idx]()).rejects.toThrow(errorMsg);
    });
  });

  describe('TeamRepository', () => {
    let repo;
    beforeEach(() => {
      repo = new TeamRepository();
    });

    const calls = [
      () => repo.findAll(),
      () => repo.findById('1'),
      () => repo.findByUserId('2'),
      () => repo.create('1', {}),
      () => repo.update('1', {}),
      () => repo.delete('1'),
    ];

    it.each(calls.map((fn, idx) => [idx]))('método %i lanza error', async (idx) => {
      await expect(calls[idx]()).rejects.toThrow(errorMsg);
    });
  });

  describe('SessionTokenRepository', () => {
    let repo;
    beforeEach(() => {
      repo = new SessionTokenRepository();
    });

    const calls = [
      () => repo.create({}),
      () => repo.findByToken('tok'),
      () => repo.deleteById('1'),
      () => repo.deleteByToken('tok'),
      () => repo.update('1', {}),
    ];

    it.each(calls.map((fn, idx) => [idx]))('método %i lanza error', async (idx) => {
      await expect(calls[idx]()).rejects.toThrow(errorMsg);
    });
  });
});
