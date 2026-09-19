import { apiClient, type CartView } from '@nova/api-client';
import { isStorefrontFakeDataEnabled, updateFakeCartItem } from '../../fixtures/dev-store-fixtures';

export async function updateCartItem(variantId: string, quantity: number): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return updateFakeCartItem(variantId, quantity);
  const response = await apiClient.patchEnvelope<CartView>(
    `/v1/cart/items/${encodeURIComponent(variantId)}`,
    { quantity },
  );
  return response.data;
}
