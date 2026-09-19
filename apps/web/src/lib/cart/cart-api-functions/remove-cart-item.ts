import { apiClient, type CartView } from '@nova/api-client';
import { isStorefrontFakeDataEnabled, removeFakeCartItem } from '../../fixtures/dev-store-fixtures';

export async function removeCartItem(variantId: string): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return removeFakeCartItem(variantId);
  const response = await apiClient.deleteEnvelope<CartView>(
    `/v1/cart/items/${encodeURIComponent(variantId)}`,
  );
  return response.data;
}
