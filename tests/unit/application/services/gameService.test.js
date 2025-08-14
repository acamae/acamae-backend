import { GameService } from '../../../../src/application/services/GameService.js';

describe('GameService (unit)', () => {
  let gameRepository;
  let userRepository;
  let service;

  beforeEach(() => {
    gameRepository = {
      findAll: jest.fn(),
    };
    userRepository = {};
    service = new GameService(gameRepository, userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listGames returns games from repository', async () => {
    const games = [
      { id: 1, code: 'lol', nameCode: 'n', imageFilename: 'x.png' },
      { id: 2, code: 'valorant', nameCode: 'm', imageFilename: 'y.png' },
    ];
    gameRepository.findAll.mockResolvedValue(games);

    const result = await service.listGames();
    expect(gameRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(games);
  });

  it('listGames throws standardized error when repository fails', async () => {
    gameRepository.findAll.mockRejectedValue(new Error('db'));
    await expect(service.listGames()).rejects.toBeInstanceOf(Error);
  });
});
