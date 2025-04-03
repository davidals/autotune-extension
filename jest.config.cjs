module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|cjs)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/mocks/styleMock.cjs',
    '^../lib/marked.min.js$': '<rootDir>/src/lib/marked.min.js'
  },
  setupFiles: ['<rootDir>/tests/setup.cjs'],
  testMatch: ['**/?(*.)+(spec|test).(js|cjs)'],
  moduleDirectories: ['node_modules', 'src']
}; 