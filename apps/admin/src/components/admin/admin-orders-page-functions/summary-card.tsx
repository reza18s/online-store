import { Icon } from '../../ui/icon';

export function SummaryCard({
  icon,
  label,
  value,
  detail,
  ltrDetail = false,
}: {
  icon: 'package' | 'user' | 'truck';
  label: string;
  value: string;
  detail: string;
  ltrDetail?: boolean;
}) {
  return (
    <article className="border border-border bg-surface p-4 shadow-card md:p-5">
      <div className="flex items-center gap-3 text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
          <Icon name={icon} size={18} />
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <strong className="mt-4 block truncate text-base" title={value}>
        {value}
      </strong>
      <span
        className="mt-2 block truncate text-[10px] text-muted-foreground"
        dir={ltrDetail ? 'ltr' : undefined}
        title={detail}
      >
        {detail}
      </span>
    </article>
  );
}
