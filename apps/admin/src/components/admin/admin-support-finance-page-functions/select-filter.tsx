import { Select as UiSelect } from '@nova/ui';

import { statusLabel } from './status-label';

export function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground" htmlFor={id}>
      {label}
      <UiSelect
        className="min-h-11 w-full appearance-none rounded-control border border-border bg-surface px-3 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">همه</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {statusLabel(option)}
          </option>
        ))}
      </UiSelect>
    </label>
  );
}
