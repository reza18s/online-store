import { type ReactNode } from 'react';

import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';

export function MessageCard({
  title,
  description,
  action,
  onAction,
  children,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <section
      className="mx-auto w-full max-w-xl rounded-editorial border border-border bg-surface p-7 text-center shadow-card"
      role="alert"
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Icon name="warning" size={22} />
      </span>
      <h1 className="mt-4 text-xl">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
      {children}
      {action && onAction ? (
        <Button className="mt-5" type="button" variant="outline" onClick={onAction}>
          <Icon name="refresh" size={16} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}
