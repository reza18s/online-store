import { useState } from 'react';

import { Button, Input as UiInput } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function OptionValue({
  value,
  canWrite,
  onSave,
}: {
  value: { id: string; label: string };
  canWrite: boolean;
  onSave: (value: { id: string; label: string }) => Promise<void>;
}) {
  const [label, setLabel] = useState(value.label);
  return (
    <span className="inline-flex min-h-9 items-center gap-1 border border-border bg-background px-2">
      <UiInput
        aria-label={`ویرایش مقدار ${value.label}`}
        className="w-20 bg-transparent text-xs outline-none"
        disabled={!canWrite}
        onChange={(event) => setLabel(event.target.value)}
        value={label}
      />
      {canWrite ? (
        <Button
          aria-label={`ذخیره مقدار ${value.label}`}
          className="flex h-7 w-7 items-center justify-center text-primary focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => void onSave({ id: value.id, label: label.trim() })}
          type="button"
        >
          <Icon name="check" size={13} />
        </Button>
      ) : null}
    </span>
  );
}
