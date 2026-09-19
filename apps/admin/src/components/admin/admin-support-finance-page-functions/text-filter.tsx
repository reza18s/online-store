import { Input as UiInput } from '@nova/ui';

export function TextFilter({
  id,
  label,
  value,
  onChange,
  placeholder,
  dir = 'rtl',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground" htmlFor={id}>
      {label}
      <UiInput
        className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
        id={id}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
