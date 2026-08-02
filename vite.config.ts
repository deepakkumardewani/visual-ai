import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: [
      'node_modules',
      'dist',
      '**/dist/**',
      '**/node_modules/**',
      'apps/web/tailwind.config.test.ts',
    ],
    environmentOptions: {
      env: {
        NODE_ENV: 'test',
      },
    },
    setupFiles: [],
  },
  lint: {
    plugins: ['typescript'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    overrides: [
      {
        files: ['apps/api/**'],
        env: {
          node: true,
        },
        rules: {
          'no-console': 'off',
        },
      },
      {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        plugins: ['typescript', 'vitest'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
          'vitest/no-disabled-tests': 'error',
        },
      },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: true,
    overrides: [
      {
        files: ['apps/api/**'],
        options: {
          singleQuote: false,
          semi: false,
          tabWidth: 4,
          trailingComma: 'all',
        },
      },
    ],
  },
});
