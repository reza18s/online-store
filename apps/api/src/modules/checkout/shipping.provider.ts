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
 * Local V1 policy matching the approved Atelier checkout fixture.
 * Provider integration and the final nationwide pricing decision remain replaceable.
 */
@Injectable()
export class FixedShippingProvider implements ShippingProvider {
  public async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    if (input.method === 'EXPRESS') {
      return {
        method: input.method,
        amountToman: 89_000,
        label: 'ارسال سریع',
        estimate: 'تحویل ۱ تا ۲ روز کاری',
      };
    }

    return {
      method: input.method,
      amountToman: 0,
      label: 'ارسال عادی',
      estimate: 'تحویل بین ۲ تا ۴ روز کاری · سراسر ایران',
    };
  }
}
