import { apiClient, type CartMergeInput, type CartView } from '@nova/api-client';
import { isStorefrontFakeDataEnabled, mergeFakeCart } from '@/shared/fixtures/dev-store-fixtures';

import { guestCartMergePath } from '@/features/cart/api/cart-api-shared';

export async function mergeGuestCart(
  input: CartMergeInput = { resolutions: [] },
): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return mergeFakeCart();
  const response = await apiClient.postEnvelope<CartView>(guestCartMergePath, input);
  return response.data;
}
