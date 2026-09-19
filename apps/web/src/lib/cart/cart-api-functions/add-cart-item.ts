import { apiClient, type ApiEnvelope, type CartView } from '@nova/api-client';
import { addFakeCartItem, isStorefrontFakeDataEnabled } from '../../fixtures/dev-store-fixtures';

import type { AddCartItemInput } from '../cart-api-shared';

export async function addCartItem(input: AddCartItemInput): Promise<CartView> {
  const { idempotencyKey, ...body } = input;
  if (isStorefrontFakeDataEnabled()) return addFakeCartItem(body.variantId, body.quantity);
  const response = await apiClient.request<ApiEnvelope<CartView>>('/v1/cart/items', {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    body: JSON.stringify(body),
  });
  return response.data;
}
