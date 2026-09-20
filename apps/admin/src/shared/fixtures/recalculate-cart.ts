import type { CartLine, CartView } from '@nova/api-client';

export function recalculateCart(items: CartLine[]): CartView {
  return {
    id: 'fake-cart-nova',
    kind: 'GUEST',
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotalToman: items.reduce((total, item) => total + item.quantity * item.unitPriceToman, 0),
    currency: 'TOMAN',
  };
}
