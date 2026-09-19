import { type CartLine } from '@nova/api-client';

import type { CartLineAvailability } from '../../../pages/cart/storefront-cart-page-shared';

export function cartLineAvailability(line: Pick<CartLine, 'available'>): CartLineAvailability {
  return line.available ? 'available' : 'unavailable';
}
