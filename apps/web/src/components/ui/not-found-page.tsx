import { EmptyState } from './empty-state';

export function NotFoundPage() {
  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <EmptyState
        title="این صفحه پیدا نشد"
        description="به نظر می‌رسد مسیر تغییر کرده است؛ از خانه دوباره شروع کنید."
        action="بازگشت به خانه"
        href="#home"
      />
    </main>
  );
}
