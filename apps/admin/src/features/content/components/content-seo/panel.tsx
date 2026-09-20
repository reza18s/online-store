import { type ReactNode } from 'react';

export function Panel({
  title,
  eyebrow,
  children,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-editorial border border-border bg-surface p-4 shadow-card md:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-3">
        <div className="text-right">
          <span className="section-heading__eyebrow">{eyebrow}</span>
          <h2 className="mt-1 text-lg leading-8 text-foreground">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
