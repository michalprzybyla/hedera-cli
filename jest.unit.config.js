const base = require('./jest.config');

module.exports = {
  ...base,
  // Match all test files except the dedicated e2e entry (we ignore it below)
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: [
    ...(base.testPathIgnorePatterns || []),
    // Ignore any e2e* tests (handled by jest.e2e.config.js)
    '.*/__tests__/e2e.*\\.test\\.ts$',
  ],
  // Optionally tighten timeout for unit tests
  testTimeout: 20000,
};
