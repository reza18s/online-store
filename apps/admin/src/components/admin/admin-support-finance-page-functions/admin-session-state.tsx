import { type IconName } from '../../ui/icon';

export function AdminSessionState({
  kind,
}: {
  kind: 'loading' | 'expired' | 'denied' | 'missing';
}) {
  const content = {
    loading: {
      icon: 'refresh' as IconName,
      title: 'در حال بررسی نشست مدیریت',
      description: 'دسترسی امن پنل در حال بررسی است.',
    },
    expired: {
      icon: 'warning' as IconName,
      title: 'نشست مدیریت منقضی شده است',
      description: 'برای ادامه دوباره وارد فضای مدیریت شوید.',
    },
    denied: {
      icon: 'warning' as IconName,
      title: 'دسترسی کافی ندارید',
      description: 'این بخش برای نقش فعلی شما فعال نیست.',
    },
    missing: {
      icon: 'user' as IconName,
      title: 'ورود به پنل مدیریت لازم است',
      description: 'برای مشاهده اطلاعات عملیاتی، ابتدا وارد شوید.',
    },
  }[kind];
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f6f6f4] px-4 py-10" dir="rtl">
      <section
        className="w-full max-w-lg border border-border bg-surface p-7 text-right shadow-float md:p-10"
        role={kind === 'denied' || kind === 'expired' ? 'alert' : 'status'}
      >
        <span className="section-heading__eyebrow">NOVA / ADMIN INSPECTION</span>
        <h1 className="mt-2 text-2xl leading-relaxed">{content.title}</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">{content.description}</p>
        {kind !== 'loading' && kind !== 'denied' ? (
          <a
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin/login"
          >
            ورود به پنل
          </a>
        ) : null}
      </section>
    </main>
  );
}
