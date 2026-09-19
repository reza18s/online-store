import { type ReactNode } from 'react';

import { Icon } from '../../ui/icon';

import type { AdminContentSeoState } from '../../../pages/admin/admin-content-seo-page-shared';

import { stateIcon } from './state-icon';

export function StatePanel({
  kind,
  title,
  description,
  action,
}: {
  kind: AdminContentSeoState;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      className="rounded-editorial border border-border bg-surface p-8 text-center shadow-card"
      role={kind === 'error' || kind === 'offline' || kind === 'permission' ? 'alert' : 'status'}
    >
      <span
        className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full ${kind === 'error' || kind === 'offline' || kind === 'permission' ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-primary'}`}
      >
        <Icon name={stateIcon(kind)} size={22} />
      </span>
      <h2 className="mt-4 text-lg leading-8">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-xs leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
