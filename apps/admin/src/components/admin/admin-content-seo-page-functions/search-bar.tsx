import { Input as UiInput } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex min-h-11 flex-1 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
      <Icon name="search" size={18} />
      <span className="sr-only">جست‌وجو</span>
      <UiInput
        dir="rtl"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
      />
    </label>
  );
}
