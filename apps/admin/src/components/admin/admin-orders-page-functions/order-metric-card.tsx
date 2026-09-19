import { Card } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function OrderMetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: 'arrow-left' | 'bag' | 'package' | 'tag';
  tone: string;
}) {
  return (
    <Card asChild className="min-h-28 p-4 md:p-5">
      <article>
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
            <Icon name={icon} size={19} />
          </span>
          <span className="text-right text-xs text-muted-foreground">{label}</span>
        </div>
        <strong className="mt-5 block text-right font-display text-2xl leading-none tabular-nums">
          {new Intl.NumberFormat('fa-IR').format(value)}
        </strong>
      </article>
    </Card>
  );
}
