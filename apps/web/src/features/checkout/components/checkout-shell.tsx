import { type ReactNode } from 'react';

export function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="shell inner-page checkout-page nova-checkout-page"
      dir="rtl"
    >
      {children}
    </main>
  );
}
