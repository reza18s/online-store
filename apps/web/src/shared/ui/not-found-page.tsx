import { EmptyState } from '@/shared/ui/empty-state';

export function NotFoundPage() {
  return (
    <main className="shell system-page">
      <EmptyState
        title="این صفحه پیدا نشد"
        description="به نظر می‌رسد مسیر تغییر کرده است؛ از خانه دوباره شروع کنید."
        action="بازگشت به خانه"
        href="/"
      />
    </main>
  );
}
