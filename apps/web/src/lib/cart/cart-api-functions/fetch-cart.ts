import { apiClient, type CartView } from '@nova/api-client';
import { getFakeCart, isStorefrontFakeDataEnabled } from '../../fixtures/dev-store-fixtures';

export async function fetchCart(): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return getFakeCart();
  const response = await apiClient.getEnvelope<CartView>('/v1/cart');
  return response.data;
}
