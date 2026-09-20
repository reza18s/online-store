import { type CheckoutQuote } from '@nova/api-client';

export function isQuoteExpired(quote: CheckoutQuote | undefined, now = Date.now()): boolean {
  if (!quote) return false;
  const expiresAt = Date.parse(quote.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}
