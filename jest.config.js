// Jest configuration for FABRIC project
module.exports = {
  testMatch: ['**/tests/**/*.test.{ts,js}'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@generated/(.*)$': '<rootDir>/generated/$1',
    '^@rules/(.*)$': '<rootDir>/src/rules/$1',
  },
};
