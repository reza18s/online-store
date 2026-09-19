import { type ReactNode } from 'react';

import { Icon } from '../../ui/icon';

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: 'package' | 'warning' | 'refresh' | 'info';
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <section
      className={`border bg-surface p-8 text-center shadow-card ${tone === 'danger' ? 'border-destructive/40' : 'border-border'}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-error-soft text-destructive' : 'bg-secondary text-primary'}`}
      >
        <Icon name={icon} size={22} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
