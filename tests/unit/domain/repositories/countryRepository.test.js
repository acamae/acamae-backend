import { CountryRepository } from '../../../../src/domain/repositories/CountryRepository.js';

describe('CountryRepository interface', () => {
  it('should throw on abstract method', async () => {
    const repo = new CountryRepository();
    await expect(repo.findAll()).rejects.toThrow('Not implemented');
  });
});

