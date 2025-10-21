// ABOUTME: Vitest configuration for BullMQ integration tests
// ABOUTME: Handles native ESM out of the box, avoiding msgpackr transpilation issues

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks', // Use forks pool for better isolation with BullMQ
    poolOptions: {
      forks: {
        singleFork: true, // Single fork for now to avoid concurrency issues
      },
    },
    testTimeout: 10000, // 10 second timeout per test
    hookTimeout: 10000, // 10 second timeout for hooks
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
