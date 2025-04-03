module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/mocks/styleMock.js'
  },
  setupFiles: ['<rootDir>/tests/setup.js']
}; 