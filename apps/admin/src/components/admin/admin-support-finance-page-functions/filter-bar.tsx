import { type FormEvent, type ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function FilterBar({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="grid gap-3 border-b border-border bg-background p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(130px,0.7fr))_auto]"
      onSubmit={onSubmit}
    >
      {children}
      <Button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="submit"
      >
        <Icon name="filter" size={15} />
        اعمال فیلتر
      </Button>
    </form>
  );
}
