import { type ReactNode } from 'react';

export function PageShell({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  return (
    <main
      className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"
      dir="rtl"
      {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
    >
      {children}
    </main>
  );
}
