import { type ReactNode } from 'react';

import { Icon, type IconName } from '../../ui/icon';

export function InspectionPanel({
  children,
  title,
  icon,
}: {
  children: ReactNode;
  title: string;
  icon: IconName;
}) {
  return (
    <section
      className="overflow-hidden rounded-panel border border-border bg-surface shadow-card"
      aria-labelledby="inspection-panel-title"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-primary">
          <Icon name={icon} size={18} />
        </span>
        <h2 className="text-base" id="inspection-panel-title">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
