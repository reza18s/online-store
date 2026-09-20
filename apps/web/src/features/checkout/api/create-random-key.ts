export function createRandomKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `nova-checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
