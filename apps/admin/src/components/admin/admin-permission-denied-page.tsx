import { AdminLogoutButton } from './admin-logout-button';

export function AdminPermissionDeniedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="alert">
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-2xl leading-relaxed">دسترسی کافی نیست</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          حساب کاربری شما برای مشاهده این بخش از فضای مدیریت مجوز لازم را ندارد.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin"
          >
            بازگشت به داشبورد
          </a>
          <AdminLogoutButton className="inline-flex min-h-11 items-center gap-2 border-0 bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50" />
        </div>
      </section>
    </main>
  );
}
