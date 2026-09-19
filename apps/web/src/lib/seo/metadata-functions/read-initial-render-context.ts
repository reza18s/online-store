import type { InitialRenderContext } from '../metadata-shared';

import { isInitialRenderData } from './is-initial-render-data';

export function readInitialRenderContext(): InitialRenderContext | undefined {
  const value = (globalThis as typeof globalThis & { __NOVA_RENDER_CONTEXT__?: unknown })
    .__NOVA_RENDER_CONTEXT__;
  if (!value || typeof value !== 'object') return undefined;
  const context = value as Partial<InitialRenderContext>;
  if (
    typeof context.path !== 'string' ||
    typeof context.hashRoute !== 'string' ||
    !context.seo ||
    typeof context.seo !== 'object'
  ) {
    return undefined;
  }
  if (context.initialData !== undefined && !isInitialRenderData(context.initialData)) {
    return undefined;
  }
  return context as InitialRenderContext;
}
