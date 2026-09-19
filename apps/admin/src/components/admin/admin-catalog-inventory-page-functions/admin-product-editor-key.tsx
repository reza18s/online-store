export function adminProductEditorKey(productId?: string): string {
  return productId ? `product:${productId}` : 'new';
}
