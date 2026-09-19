import { Card } from '@nova/ui';

import { Icon, type IconName } from '../ui/icon';

export function AdminMetricCard({
  label,
  value,
  note,
  icon,
  iconTone,
  orderClass,
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  iconTone: string;
  orderClass: string;
}) {
  return (
    <Card
      asChild
      className={`flex min-h-[124px] flex-col justify-between bg-surface p-4 transition-shadow hover:shadow-float md:p-5 ${orderClass}`}
    >
      <article>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconTone}`}
          >
            <Icon name={icon} size={20} />
          </span>
          <span className="text-right text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-right">
          <strong className="block font-display text-2xl leading-none tracking-tight text-foreground md:text-[27px]">
            {value}
          </strong>
          <span className="mt-2 block text-[10px] text-success">{note}</span>
        </div>
      </article>
    </Card>
  );
}
