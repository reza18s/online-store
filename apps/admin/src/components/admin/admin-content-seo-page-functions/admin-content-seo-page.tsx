import { useStaffUser } from '../../../lib/admin/admin-catalog-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from '../../../lib/admin/admin-auth';

import { Icon } from '../../ui/icon';

import { AdminContentSeoNavigation } from './admin-content-seo-navigation';

import { ContentView } from './content-view';

import { RedirectsView } from './redirects-view';

import { SeoView } from './seo-view';

import { StatePanel } from './state-panel';

import { canManageAdminContent } from './can-manage-admin-content';

import { normalizeAdminContentSeoView } from './normalize-admin-content-seo-view';

export function AdminContentSeoPage({
  view = 'content',
  pageId,
  staffRoles,
}: {
  view?: string;
  pageId?: string;
  staffRoles?: readonly string[];
}) {
  const activeView = normalizeAdminContentSeoView(view);
  const staffQuery = useStaffUser(staffRoles === undefined);
  const roles = staffRoles ?? staffQuery.data?.roles;
  const hasExternalStaffState = staffRoles === undefined;
  if (hasExternalStaffState && staffQuery.isPending)
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="loading"
            title="در حال بررسی نشست مدیریت"
            description="دسترسی این بخش در حال بررسی است."
          />
        </div>
      </main>
    );
  if (hasExternalStaffState && isStaffAuthFailure(staffQuery.error))
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="expired"
            title="نشست مدیریت منقضی شده است"
            description="برای ادامه، دوباره وارد فضای مدیریت شوید."
          />
        </div>
      </main>
    );
  if (hasExternalStaffState && isStaffAuthorizationFailure(staffQuery.error))
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="permission"
            title="دسترسی این بخش مجاز نیست"
            description="حساب فعلی اجازه دسترسی به محتوای مدیریتی را ندارد."
          />
        </div>
      </main>
    );
  if (hasExternalStaffState && !staffQuery.data)
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="permission"
            title="نشست مدیریت پیدا نشد"
            description="برای مشاهده و تغییر محتوا باید وارد فضای مدیریت شوید."
          />
        </div>
      </main>
    );
  const canEdit = canManageAdminContent(roles);
  if (!canEdit)
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="permission"
            title="دسترسی کافی ندارید"
            description="این بخش به نقش مدیر نیاز دارد؛ کنترل‌های تغییردهنده برای نقش‌های دیگر نمایش داده نمی‌شوند."
          />
        </div>
      </main>
    );
  return (
    <main
      dir="rtl"
      className="min-h-svh bg-[#f6f3ed] px-4 py-5 text-foreground md:px-6 md:py-8 lg:px-8"
    >
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="text-right">
            <span className="section-heading__eyebrow">ATELIER EDITORIAL / ADMIN</span>
            <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">محتوا و دیده‌شدن</h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              صفحه‌های عمومی، متادیتای SEO و انتقال‌های سایت را با چرخه پیش‌نویس تا انتشار مدیریت
              کنید.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-[11px] text-muted-foreground">
            <Icon name="check" size={15} />
            اتصال به قراردادهای واقعی محتوا
          </div>
        </header>
        <AdminContentSeoNavigation activeView={activeView} />
        <div className="mt-5">
          {activeView === 'content' ? (
            <ContentView canEdit={canEdit} pageId={pageId} />
          ) : activeView === 'seo' ? (
            <SeoView canEdit={canEdit} />
          ) : (
            <RedirectsView canEdit={canEdit} />
          )}
        </div>
      </div>
    </main>
  );
}
