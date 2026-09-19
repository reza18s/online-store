import { type ReactNode } from 'react';

export function PageFrame({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background ${className}`}
    >
      {children}
    </main>
  );
}
