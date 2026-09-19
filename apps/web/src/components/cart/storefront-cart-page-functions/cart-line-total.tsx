import { type CartLine } from '@nova/api-client';

export function cartLineTotal(line: Pick<CartLine, 'quantity' | 'unitPriceToman'>): number {
  return line.quantity * line.unitPriceToman;
}
