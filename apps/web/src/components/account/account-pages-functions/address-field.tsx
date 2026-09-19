import { Input as UiInput } from '@nova/ui';

export function AddressField({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <UiInput
        className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
}
