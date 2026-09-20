import { ApiClientError } from '@nova/api-client';

export function staffLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 429) {
      return 'تعداد تلاش‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'ایمیل، رمز عبور یا کد تأیید دومرحله‌ای نادرست است.';
    }
    if (error.status === 422) {
      return 'اطلاعات ورود را با قالب درست وارد کنید.';
    }
  }
  return 'ورود به فضای مدیریت انجام نشد؛ دوباره تلاش کنید.';
}
