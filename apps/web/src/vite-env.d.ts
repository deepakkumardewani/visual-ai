/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

/** Injected by vite `define` from apps/web/package.json. */
declare const __APP_VERSION__: string;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
