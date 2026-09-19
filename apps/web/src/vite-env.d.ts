declare module '*.css';

import type { InitialRenderContext } from './lib/seo/metadata';

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  var __NOVA_RENDER_CONTEXT__: InitialRenderContext | undefined;
}

export {};
