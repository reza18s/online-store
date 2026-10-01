import { Input as UiInput } from '@nova/ui';

import { Icon, type IconName } from '@/shared/ui/icon';

export function AddressField({
  label,
  value,
  onChange,
  icon,
  hint,
  required = false,
  className = '',
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: IconName;
  hint?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className={`address-field flex flex-col gap-2 text-sm font-medium ${className}`}>
      <span className="address-field__label">
        {label}
        {required ? <b aria-hidden="true">*</b> : null}
      </span>
      <span className="address-field__control">
        <UiInput
          className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...props}
        />
        {icon ? <Icon name={icon} size={17} aria-hidden="true" /> : null}
      </span>
      {hint ? <small className="address-field__hint">{hint}</small> : null}
    </label>
  );
}
