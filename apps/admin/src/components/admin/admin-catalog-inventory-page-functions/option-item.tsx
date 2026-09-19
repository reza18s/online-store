import { useState } from 'react';
import { type AdminCatalogProductOption } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { OptionValue } from './option-value';

export function OptionItem({
  option,
  canWrite,
  newValue,
  onNewValue,
  onAddValue,
  createValue,
  onUpdate,
  onUpdateValue,
}: {
  option: AdminCatalogProductOption;
  canWrite: boolean;
  newValue: string;
  onNewValue: (value: string) => void;
  onAddValue: () => void;
  createValue: boolean;
  onUpdate: (name: string) => Promise<void>;
  onUpdateValue: (value: { id: string; label: string }) => Promise<void>;
}) {
  const [name, setName] = useState(option.name);
  return (
    <div className="py-4">
      <div className="flex items-center gap-2">
        <UiInput
          aria-label={`نام گزینه ${option.key}`}
          className="min-h-10 min-w-0 flex-1 border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        {canWrite ? (
          <Button
            aria-label={`ذخیره گزینه ${option.name}`}
            onClick={() => void onUpdate(name.trim())}
            size="icon"
            variant="outline"
          >
            <Icon name="check" size={15} />
          </Button>
        ) : null}
        <span className="text-[10px] text-muted-foreground" dir="ltr">
          {option.key}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {option.values.map((value) => (
          <OptionValue key={value.id} value={value} canWrite={canWrite} onSave={onUpdateValue} />
        ))}
      </div>
      {canWrite ? (
        <div className="mt-3 flex gap-2">
          <UiInput
            aria-label={`مقدار جدید برای ${option.name}`}
            className="min-h-10 min-w-0 flex-1 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => onNewValue(event.target.value)}
            placeholder="new-value"
            value={newValue}
          />
          <Button loading={createValue} onClick={onAddValue} size="sm" type="button">
            <Icon name="plus" size={15} /> مقدار
          </Button>
        </div>
      ) : null}
    </div>
  );
}
