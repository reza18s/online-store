import { type ReactNode } from 'react';

import { Label, Select as UiSelect } from '@nova/ui';

export function Select({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <UiSelect
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      >
        {children}
      </UiSelect>
    </Label>
  );
}
