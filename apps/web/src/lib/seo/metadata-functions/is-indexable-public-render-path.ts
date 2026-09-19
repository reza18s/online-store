import { parsePublicRenderPath } from './parse-public-render-path';

export function isIndexablePublicRenderPath(path: string): boolean {
  const route = parsePublicRenderPath(path);
  return (
    route.kind === 'home' ||
    route.kind === 'category' ||
    route.kind === 'product' ||
    route.kind === 'content'
  );
}
