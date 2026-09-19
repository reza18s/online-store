import type { PaymentRecoveryState } from '../checkout-state-shared';

export function paymentRecoveryCopy(state: PaymentRecoveryState): {
  title: string;
  message: string;
  actionLabel: string;
} {
  switch (state) {
    case 'pending':
      return {
        title: 'پرداخت هنوز تأیید نشده است',
        message: 'وضعیت پرداخت توسط سرور بررسی می‌شود. تا دریافت نتیجه، دوباره پرداخت نکنید.',
        actionLabel: 'بررسی دوباره وضعیت',
      };
    case 'failed':
      return {
        title: 'پرداخت ناموفق بود',
        message:
          'از حساب شما تأیید موفقی دریافت نشده است. می‌توانید وضعیت سفارش را ببینید یا دوباره از مرحله پرداخت شروع کنید.',
        actionLabel: 'بازگشت به پرداخت',
      };
    case 'cancelled':
      return {
        title: 'پرداخت لغو شد',
        message:
          'سفارش جدیدی ثبت نشده است. در صورت تمایل، پرداخت را از همین سفارش دوباره بررسی کنید.',
        actionLabel: 'بازگشت به پرداخت',
      };
    case 'timeout':
      return {
        title: 'زمان پاسخ پرداخت تمام شد',
        message:
          'نتیجه قطعی دریافت نشد. برای جلوگیری از پرداخت تکراری، ابتدا وضعیت سفارش را بررسی کنید.',
        actionLabel: 'مشاهده وضعیت سفارش',
      };
    case 'redirecting':
      return {
        title: 'در حال انتقال به درگاه',
        message: 'درگاه پرداخت باز می‌شود. صفحه را نبندید.',
        actionLabel: 'ادامه',
      };
    case 'recovery':
      return {
        title: 'بازگشت از پرداخت',
        message:
          'نتیجه پرداخت از پارامترهای مرورگر تأیید نمی‌شود؛ وضعیت معتبر سفارش را از سرور می‌خوانیم.',
        actionLabel: 'بررسی وضعیت',
      };
  }
}
