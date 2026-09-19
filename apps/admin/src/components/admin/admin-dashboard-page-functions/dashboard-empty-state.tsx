import { Card } from '@nova/ui';

export function DashboardEmptyState() {
  return (
    <Card
      asChild
      className="border border-border bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="status"
    >
      <section>
        <h2 className="text-lg leading-relaxed">خلاصه‌ای برای نمایش وجود ندارد</h2>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          در این بازه داده‌ای از API دریافت نشد.
        </p>
      </section>
    </Card>
  );
}
