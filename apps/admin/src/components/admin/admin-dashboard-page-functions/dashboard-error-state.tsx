import { Button, Card } from '@nova/ui';

import { adminDashboardErrorMessage } from './admin-dashboard-error-message';

export function DashboardErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Card
      asChild
      className="border border-destructive/30 bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="alert"
    >
      <section>
        <h2 className="text-lg leading-relaxed">خلاصه داشبورد در دسترس نیست</h2>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          {adminDashboardErrorMessage(error)}
        </p>
        <Button
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-4 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          onClick={onRetry}
        >
          تلاش دوباره
        </Button>
      </section>
    </Card>
  );
}
