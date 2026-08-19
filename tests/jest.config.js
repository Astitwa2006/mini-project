/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/unit/**/*.test.js', '**/integration/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '../server/src/services/**/*.js',
    '../server/src/utils/**/*.js',
  ],
  setupFilesAfterEnv: [],
  testTimeout: 15000,
};
