import { Button } from '@nova/ui';

import { Icon } from './icon';

export function EmptyState({
  title,
  description,
  action,
  href,
  onAction,
}: {
  title: string;
  description?: string;
  action: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <section className="empty-state">
      <span className="empty-state__icon">
        <Icon name="layers" size={25} />
      </span>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : (
        <Button asChild>
          <a href={href ?? '#home'}>{action}</a>
        </Button>
      )}
    </section>
  );
}
