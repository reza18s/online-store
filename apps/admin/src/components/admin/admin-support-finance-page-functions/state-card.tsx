import { Button } from '@nova/ui';

import { Icon, type IconName } from '../../ui/icon';

export function StateCard({
  icon,
  title,
  description,
  action,
  onAction,
  role,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  role: 'alert' | 'status';
}) {
  return (
    <section
      className="border border-dashed border-border bg-background p-8 text-center"
      role={role}
    >
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-primary">
        <Icon name={icon} size={21} />
      </span>
      <h2 className="mt-4 text-base leading-7">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">{description}</p>
      {action && onAction ? (
        <Button
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          onClick={onAction}
        >
          <Icon name="refresh" size={15} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}
