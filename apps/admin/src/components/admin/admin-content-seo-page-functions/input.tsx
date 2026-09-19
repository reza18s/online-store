import { Input as UiInput, Label } from '@nova/ui';

export function Input({
  label,
  value,
  onChange,
  dir = 'rtl',
  error,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <Label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <UiInput
        {...props}
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      />
      {error ? (
        <span className="block text-[11px] leading-6 text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </Label>
  );
}
