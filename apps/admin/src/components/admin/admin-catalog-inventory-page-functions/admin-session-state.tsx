import { Button } from '@nova/ui';

import { type IconName } from '../../ui/icon';

import { StatePanel } from './state-panel';

export function AdminSessionState({
  kind,
}: {
  kind: 'loading' | 'expired' | 'denied' | 'missing';
}) {
  const content = {
    loading: {
      icon: 'refresh' as IconName,
      title: 'در حال بررسی نشست مدیریت',
      description: 'دسترسی عملیاتی از سرویس مدیریت بررسی می‌شود.',
    },
    expired: {
      icon: 'refresh' as IconName,
      title: 'نشست مدیریت منقضی شده است',
      description: 'برای مشاهده کاتالوگ و موجودی دوباره وارد پنل شوید.',
    },
    denied: {
      icon: 'warning' as IconName,
      title: 'دسترسی مدیریت کافی نیست',
      description: 'نقش فعلی شما اجازه مشاهده این بخش عملیاتی را ندارد.',
    },
    missing: {
      icon: 'user' as IconName,
      title: 'ورود به پنل مدیریت لازم است',
      description: 'برای مشاهده اطلاعات واقعی کاتالوگ و موجودی ابتدا وارد شوید.',
    },
  }[kind];
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10" dir="rtl">
      <StatePanel
        icon={content.icon}
        title={content.title}
        description={content.description}
        tone={kind === 'denied' || kind === 'expired' ? 'danger' : 'neutral'}
        action={
          kind !== 'loading' && kind !== 'denied' ? (
            <Button asChild>
              <a href="#admin/login">ورود به پنل</a>
            </Button>
          ) : undefined
        }
      />
    </main>
  );
}
