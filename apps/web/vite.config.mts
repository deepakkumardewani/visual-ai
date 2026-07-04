// Plugins
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
// import Fonts from 'unplugin-fonts/vite'
import Components from 'unplugin-vue-components/vite';
// Utilities
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

import Vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const tailwindConfigPath = path.join(appDir, 'tailwind.config.js');

export default defineConfig({
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
          if (id.includes('node_modules/vuetify')) {
            return 'vuetify';
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
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    // Fonts({
    //   google: {
    //     families: [
    //       {
    //         name: 'Roboto',
    //         styles: 'wght@100;300;400;500;700;900'
    //       }
    //     ]
    //   }
    // })
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 3005,
  },
  preview: {
    port: 3005,
  },
});
