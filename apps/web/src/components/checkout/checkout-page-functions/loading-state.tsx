import { CheckoutShell } from './checkout-shell';

export function LoadingState({ label }: { label: string }) {
  return (
    <CheckoutShell>
      <section className="checkout-layout animate-pulse lg:grid" role="status" aria-label={label}>
        <div className="h-96 rounded bg-secondary" />
        <div className="h-64 rounded bg-secondary" />
      </section>
    </CheckoutShell>
  );
}
