import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

type AdminProductsDataStateProps = {
  title: string;
  message: string;
  role: 'status' | 'alert';
  onRetry: () => void;
};

export function AdminProductsDataState({
  title,
  message,
  role,
  onRetry,
}: AdminProductsDataStateProps) {
  return (
    <section
      className="mt-4 rounded-panel border border-border bg-surface p-8 text-center shadow-card"
      role={role}
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon name={role === 'alert' ? 'warning' : 'refresh'} size={22} />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">{message}</p>
      <Button
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
        onClick={onRetry}
      >
        <Icon name="refresh" size={16} />
        دوباره تلاش کنید
      </Button>
    </section>
  );
}
