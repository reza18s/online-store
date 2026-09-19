import { SUMMARY_METRICS } from '../../../pages/admin/admin-dashboard-page-shared';

export function DashboardLoadingState() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="در حال دریافت خلاصه داشبورد">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {SUMMARY_METRICS.map((metric) => (
          <div
            className="min-h-32 animate-pulse border border-border bg-surface p-4"
            key={metric.key}
          />
        ))}
      </div>
      <p className="text-right text-sm text-muted-foreground" role="status">
        در حال دریافت خلاصه داشبورد…
      </p>
    </section>
  );
}
