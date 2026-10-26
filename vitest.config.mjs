import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    env: { NODE_ENV: 'test' },
    // Sequential files: the Postgres job shares one database across suites.
    fileParallelism: false,
  },
});
