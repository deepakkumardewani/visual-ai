// Plugins
import { URL, fileURLToPath } from "node:url";
import AutoImport from "unplugin-auto-import/vite";
// import Fonts from 'unplugin-fonts/vite'
import Components from "unplugin-vue-components/vite";
// Utilities
import { defineConfig } from "vite";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

import Vue from "@vitejs/plugin-vue";

export default defineConfig({
  staged: { "*": "vp check --fix" },
  build: {
    minify: "terser", // Use terser for better minification
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
        manualChunks: {
          "vue-vendor": ["vue", "vue-router", "pinia"],
          vuetify: ["vuetify"],
        },
        // Optimize chunk names
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },
  plugins: [
    AutoImport({
      imports: [
        "vue",
        {
          "vue-router/auto": ["useRoute", "useRouter"],
        },
      ],
      dts: "src/auto-imports.d.ts",
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: "src/components.d.ts",
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss",
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
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 3000,
  },
});
