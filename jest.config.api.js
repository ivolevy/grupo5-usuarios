/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'node', // Usar Node environment para tests de API
  setupFilesAfterEnv: ['<rootDir>/__tests__/api/jest.setup.api.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/back/',
  ],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
      }
    }]
  },
  testMatch: [
    '<rootDir>/__tests__/api/**/*.test.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

module.exports = config;

