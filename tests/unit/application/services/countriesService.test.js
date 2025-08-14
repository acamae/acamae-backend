import { CountriesService } from '../../../../src/application/services/CountriesService.js';

describe('CountriesService (unit)', () => {
  let repo;
  let fallbacks;
  let service;

  beforeEach(() => {
    repo = { findAll: jest.fn() };
    fallbacks = { loadFromTzdb: jest.fn() };
    service = new CountriesService(repo, fallbacks);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns DB rows when repository succeeds', async () => {
    const rows = [
      { code: 'ES', name: 'Spain' },
      { code: 'FR', name: 'France' },
    ];
    repo.findAll.mockResolvedValue(rows);
    const res = await service.listCountries();
    expect(res).toEqual({ countries: rows });
    expect(fallbacks.loadFromTzdb).not.toHaveBeenCalled();
  });

  it('falls back to tzdb when repository fails', async () => {
    repo.findAll.mockRejectedValue(new Error('db'));
    const fb = { countries: [{ code: 'DE', name: 'Germany' }] };
    fallbacks.loadFromTzdb.mockResolvedValue(fb);
    const res = await service.listCountries();
    expect(res).toEqual({ countries: fb.countries });
  });
});

