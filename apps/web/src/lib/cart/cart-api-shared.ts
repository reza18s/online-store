import { type CartItemMutation } from '@nova/api-client';

export interface AddCartItemInput extends CartItemMutation {
  idempotencyKey?: string;
}

export const guestCartMergePath = '/v1/cart/merge';
