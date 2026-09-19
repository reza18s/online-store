import { ApiClientError } from '@nova/api-client';

export function adminCatalogInventoryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست کاربری منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه انجام این عملیات را ندارید.';
    if (error.status === 409) return 'اطلاعات هم‌زمان تغییر کرده است؛ نسخه تازه را بارگیری کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
