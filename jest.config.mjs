// ABOUTME: Configures Jest for the NextNest codebase.
// ABOUTME: Wraps Next.js defaults so component tests run in jsdom.
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/plugins.disabled/'],
  // Transform ESM modules (BullMQ, msgpackr, etc.)
  transformIgnorePatterns: [
    'node_modules/(?!(bullmq|msgpackr|ioredis|get-port|uuid|cron-parser|@msgpack)/)',
  ],
};

export default createJestConfig(customJestConfig);
