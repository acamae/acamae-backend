import { GameRepository } from '../../../../src/domain/repositories/GameRepository.js';

describe('GameRepository interface', () => {
  let repo;
  beforeEach(() => {
    repo = new GameRepository();
  });

  it('findAll throws', async () => {
    await expect(repo.findAll()).rejects.toThrow('Not implemented');
  });

  it('findById throws', async () => {
    await expect(repo.findById(1)).rejects.toThrow('Not implemented');
  });

  it('findByCode throws', async () => {
    await expect(repo.findByCode('lol')).rejects.toThrow('Not implemented');
  });
});
