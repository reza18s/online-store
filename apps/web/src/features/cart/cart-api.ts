import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ApiClientError,
  apiClient,
  queryKeys,
  type ApiEnvelope,
  type CartItemMutation,
  type CartMergeInput,
  type CartMergeConflict,
  type CartView,
} from '@nova/api-client';
import {
  addFakeCartItem,
  getFakeCart,
  isStorefrontFakeDataEnabled,
  mergeFakeCart,
  removeFakeCartItem,
  updateFakeCartItem,
} from '../../shared/dev-store-fixtures';

export interface AddCartItemInput extends CartItemMutation {
  idempotencyKey?: string;
}

export const guestCartMergePath = '/v1/cart/merge';

export async function fetchCart(): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return getFakeCart();
  const response = await apiClient.getEnvelope<CartView>('/v1/cart');
  return response.data;
}

export async function mergeGuestCart(
  input: CartMergeInput = { resolutions: [] },
): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return mergeFakeCart();
  const response = await apiClient.postEnvelope<CartView>(guestCartMergePath, input);
  return response.data;
}

export function shouldMergeGuestCart(cart: CartView | undefined, customerId?: string): boolean {
  return Boolean(customerId && cart?.kind === 'GUEST');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCartMergeConflict(value: unknown): value is CartMergeConflict {
  if (!isRecord(value)) return false;
  if (typeof value.variantId !== 'string' || value.variantId.length === 0) return false;
  if (
    value.reason !== 'VARIANT_UNAVAILABLE' &&
    value.reason !== 'STOCK_LIMIT' &&
    value.reason !== 'QUANTITY_LIMIT'
  ) {
    return false;
  }
  const guestQuantity = value.guestQuantity;
  const customerQuantity = value.customerQuantity;
  const mergedQuantity = value.mergedQuantity;
  const availableQuantity = value.availableQuantity;
  if (
    typeof guestQuantity !== 'number' ||
    !Number.isSafeInteger(guestQuantity) ||
    guestQuantity < 1 ||
    typeof customerQuantity !== 'number' ||
    !Number.isSafeInteger(customerQuantity) ||
    customerQuantity < 0 ||
    typeof mergedQuantity !== 'number' ||
    !Number.isSafeInteger(mergedQuantity) ||
    mergedQuantity < 1
  ) {
    return false;
  }
  return (
    availableQuantity === null ||
    (typeof availableQuantity === 'number' &&
      Number.isSafeInteger(availableQuantity) &&
      availableQuantity >= 0)
  );
}

export function getCartMergeConflicts(error: unknown): CartMergeConflict[] {
  if (!(error instanceof ApiClientError) || error.payload?.error.code !== 'CART_MERGE_CONFLICT') {
    return [];
  }
  const details = error.payload.error.details;
  if (!isRecord(details) || !Array.isArray(details.conflicts)) return [];
  return details.conflicts.filter(isCartMergeConflict);
}

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

export async function updateCartItem(variantId: string, quantity: number): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return updateFakeCartItem(variantId, quantity);
  const response = await apiClient.patchEnvelope<CartView>(
    `/v1/cart/items/${encodeURIComponent(variantId)}`,
    { quantity },
  );
  return response.data;
}

export async function removeCartItem(variantId: string): Promise<CartView> {
  if (isStorefrontFakeDataEnabled()) return removeFakeCartItem(variantId);
  const response = await apiClient.deleteEnvelope<CartView>(
    `/v1/cart/items/${encodeURIComponent(variantId)}`,
  );
  return response.data;
}

export function useCart(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: fetchCart,
    enabled,
    staleTime: 15_000,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}

export function useMergeGuestCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergeGuestCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      updateCartItem(variantId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}
