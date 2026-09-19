import { type ReactNode } from 'react';

import { Icon } from '../../ui/icon';

export function PanelHeading({
  icon,
  title,
  id,
  children,
}: {
  icon: 'bag' | 'calendar' | 'truck' | 'rotate' | 'info';
  title: string;
  id: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
      <h2 className="flex items-center gap-2 text-base font-semibold" id={id}>
        <Icon name={icon} size={18} />
        {title}
      </h2>
      {children}
    </div>
  );
}
