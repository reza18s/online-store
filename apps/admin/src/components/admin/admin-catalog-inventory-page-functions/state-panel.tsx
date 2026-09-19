import { type ReactNode } from 'react';

import { Icon, type IconName } from '../../ui/icon';

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: IconName;
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
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-error-soft text-destructive' : 'bg-accent-soft text-primary'}`}
      >
        <Icon name={icon} size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
