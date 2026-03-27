module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/ui/dist/'],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/ui/dist/**',
    '!**/config/**',
    '!**/db/**'
  ],
  moduleFileExtensions: ['js'],
  transform: {
    '^.+\.js$': 'babel-jest'
  }
};