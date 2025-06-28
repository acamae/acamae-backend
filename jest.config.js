export default {
  testEnvironment: 'node',
  verbose: true,
  moduleFileExtensions: ['js', 'json'],
  rootDir: '.',
  setupFilesAfterEnv: ['./jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/**/index.js', '!src/**/config/**'],
  coverageDirectory: 'coverage',
};
