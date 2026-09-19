import { type ReactNode } from 'react';

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-control border border-border bg-background p-3">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-xs">{children}</dd>
    </div>
  );
}
