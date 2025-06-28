export const createEnvMock = (overrides = {}) => ({
  config: {
    env: 'test',
    port: 4001,
    cors: {
      origin: 'https://localhost',
      allowedOrigins: ['https://localhost'],
      frontendUrl: 'https://localhost',
    },
    jwt: {
      secret: 'x'.repeat(32),
      refreshSecret: 'y'.repeat(32),
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    rateLimit: { windowMs: 1000, max: 1000, auth: { windowMs: 1000, max: 1000 } },
    ...overrides,
  },
});
