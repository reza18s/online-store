import { Card } from '@nova/ui';

export function DashboardAccessDenied() {
  return (
    <Card
      asChild
      className="mx-auto max-w-xl bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="alert"
    >
      <section>
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-xl leading-relaxed">دسترسی کافی نیست</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          حساب کاربری شما برای مشاهده خلاصه داشبورد مجوز مدیر را ندارد.
        </p>
      </section>
    </Card>
  );
}
