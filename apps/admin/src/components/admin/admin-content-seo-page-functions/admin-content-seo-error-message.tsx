import { ApiClientError } from '@nova/api-client';

import { isOfflineError } from './is-offline-error';

export function adminContentSeoErrorMessage(
  error: unknown,
  fallback = 'عملیات انجام نشد؛ دوباره تلاش کنید.',
): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست مدیریت منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه انجام این عملیات را ندارید.';
    if (error.status === 409) return 'این رکورد هم‌زمان تغییر کرده است؛ نسخه تازه را بارگیری کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (isOfflineError(error)) return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  return error instanceof Error && error.message ? error.message : fallback;
}
