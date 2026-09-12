import { Injectable } from '@nestjs/common';

export const SHIPPING_PROVIDER = Symbol('SHIPPING_PROVIDER');

export type ShippingMethod = 'STANDARD' | 'EXPRESS';

export interface ShippingQuoteInput {
  method: ShippingMethod;
  province: string;
  subtotalToman: number;
}

export interface ShippingQuote {
  method: ShippingMethod;
  amountToman: number;
  label: string;
  estimate: string;
}

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuote>;
}

/**
 * Deterministic local/test policy. It deliberately has no transport dependency so
 * local checkout never makes a provider request.
 */
@Injectable()
export class LocalShippingProvider implements ShippingProvider {
  public async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    if (input.method === 'EXPRESS') {
      return {
        method: input.method,
        amountToman: 89_000,
        label: 'اکسپرس',
        estimate: 'تحویل ۱ تا ۲ روز کاری',
      };
    }

    return {
      method: input.method,
      amountToman: 0,
      label: 'پیشتاز',
      estimate: 'تحویل بین ۲ تا ۴ روز کاری · سراسر ایران',
    };
  }
}

/**
 * Compatibility name for existing checkout unit fixtures. Production wiring uses
 * the explicit local/test or Tapin selection in checkout.module.ts.
 */
export class FixedShippingProvider extends LocalShippingProvider {}
