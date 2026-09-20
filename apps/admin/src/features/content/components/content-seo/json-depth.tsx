export function jsonDepth(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const children = Array.isArray(value) ? value : Object.values(value);
  return children.length ? 1 + Math.max(...children.map(jsonDepth)) : 1;
}
