import { Input as UiInput } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <span className="relative mt-2 block">
        <Icon
          className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          name="search"
          size={17}
        />
        <UiInput
          aria-label={label}
          className="min-h-12 w-full border border-border bg-background px-3 pe-10 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </span>
    </label>
  );
}
