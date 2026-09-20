import { ApiClientError } from '@nova/api-client';

export function adminDashboardErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست مدیریت منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه مشاهده خلاصه داشبورد را ندارید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  return error instanceof Error && error.message
    ? error.message
    : 'دریافت خلاصه داشبورد با خطا روبه‌رو شد.';
}
