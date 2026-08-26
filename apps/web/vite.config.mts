// Plugins
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
// Utilities
/// <reference types="vitest" />
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vite-plus';

import Vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const tailwindConfigPath = path.join(appDir, 'tailwind.config.js');
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

/** Fake Clerk pk_test used only when VITE_PRERENDER=1 and the real key is unset. Never used by `vp dev`. */
const PRERENDER_CLERK_PLACEHOLDER = 'pk_test_prerender-placeholder-not-a-real-key';

function clerkKeyDefine(mode: string): Record<string, string> {
  const env = loadEnv(mode, appDir, 'VITE_');
  const key = env.VITE_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (key) {
    return {};
  }
  if (process.env.VITE_PRERENDER === '1') {
    console.warn(
      '[prerender] VITE_CLERK_PUBLISHABLE_KEY is empty; inlining pk_test placeholder so registerPlugins does not throw. Set a real key for runtime deploys.',
    );
    return {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(PRERENDER_CLERK_PLACEHOLDER),
    };
  }
  return {};
}

function marketingPrerenderPlugin(): Plugin {
  return {
    name: 'marketing-prerender',
    apply: 'build',
    async closeBundle() {
      if (process.env.VITE_SKIP_PRERENDER === '1') {
        return;
      }
      const { execFile } = await import('node:child_process');
      await new Promise<void>((resolve, reject) => {
        const child = execFile(
          'bun',
          [path.join(appDir, 'scripts/prerender.mjs')],
          { cwd: appDir },
          (error, stdout, stderr) => {
            if (stdout) console.warn(stdout);
            if (stderr) console.error(stderr);
            if (error) reject(error);
            else resolve();
          },
        );
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  css: {
    postcss: {
      plugins: [tailwindcss({ config: tailwindConfigPath }), autoprefixer()],
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
  build: {
    minify: 'terser', // Use terser for better minification
    cssCodeSplit: false, // Prevent splitting CSS to reduce overhead
    sourcemap: false, // Disable source maps
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssMinify: true, // Enable CSS minification
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/vue-router') ||
            id.includes('node_modules/pinia')
          ) {
            return 'vue-vendor';
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [
    AutoImport({
      imports: [
        'vue',
        {
          'vue-router/auto': ['useRoute', 'useRouter'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Vue(),
    marketingPrerenderPlugin(),
  ],
  define: { 'process.env': {}, ...clerkKeyDefine(mode) },
  resolve: {
    alias: {
      '@': srcDir,
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 3005,
  },
  preview: {
    port: 3005,
  },
}));
