export function resolveInventoryDetailState(input: {
  hasItem: boolean;
  enabled: boolean;
  isPending: boolean;
  isError: boolean;
}): 'empty' | 'loading' | 'error' | 'ready' {
  if (input.enabled && input.isPending && !input.hasItem) return 'loading';
  if (input.enabled && input.isError && !input.hasItem) return 'error';
  return input.hasItem ? 'ready' : 'empty';
}
