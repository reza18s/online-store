import { Label, Textarea as UiTextarea } from '@nova/ui';

export function Textarea({
  label,
  value,
  onChange,
  dir = 'rtl',
  hint,
  rows = 5,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  hint?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <Label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <UiTextarea
        dir={dir}
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      />
      {hint ? (
        <span className="block text-[11px] leading-6 text-muted-foreground">{hint}</span>
      ) : null}
    </Label>
  );
}
