export function adminInventoryViewKey(variantId?: string): string {
  return variantId ? `inventory:${variantId}` : 'inventory';
}
