import { Button } from '@nova/ui';

import { Icon } from '../../../components/ui/icon';

export function EmptyState({
  title,
  description,
  action,
  href = '#home',
  onAction,
  icon = 'layers',
}: {
  title: string;
  description: string;
  action: string;
  href?: string;
  onAction?: () => void;
  icon?: 'layers' | 'user' | 'warning' | 'refresh' | 'package';
}) {
  return (
    <section className="empty-state" role="status">
      <span className="empty-state__icon">
        <Icon name={icon} size={25} />
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : (
        <Button asChild>
          <a href={href}>{action}</a>
        </Button>
      )}
    </section>
  );
}
