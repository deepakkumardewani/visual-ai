import { defineConfig } from 'vitest/config';

// Standalone config: the repo-root config assumes the web app's cwd-relative setup file and happy-dom.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
