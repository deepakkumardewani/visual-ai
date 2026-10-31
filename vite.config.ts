import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import AutoImport from 'unplugin-auto-import/vite';
import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, 'apps/api/.env') });

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        'vue',
        {
          'vue-router/auto': ['useRoute', 'useRouter'],
        },
      ],
      dts: false,
      vueTemplate: true,
    }),
    vue(),
  ],
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
      'apps/web/e2e/**',
    ],
    env: {
      VITE_TELEMETRYDECK_APP_ID: 'vitest-test-app-id',
    },
    environmentOptions: {
      env: {
        NODE_ENV: 'test',
      },
    },
    setupFiles: ['apps/web/src/test/setup.ts'],
    // Node 25+ ships an experimental global localStorage that throws without --localstorage-file
    // and shadows happy-dom's implementation; disable it in test workers.
    execArgv: ['--no-experimental-webstorage'],
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
          '@typescript-eslint/unbound-method': 'off',
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
