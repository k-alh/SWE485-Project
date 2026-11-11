import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      SESSION_SECRET: 'test-secret-that-is-long-enough-1234',
      AI_PROVIDER: 'mock',
    },
  },
});
