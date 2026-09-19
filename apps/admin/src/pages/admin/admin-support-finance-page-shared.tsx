import { type IconName } from '../../components/ui/icon';

export type AdminSupportFinanceView = 'payments' | 'customers' | 'notifications' | 'audit';

export type AdminStaffRole = 'support' | 'operations' | 'admin';

export type QueryResult<T> = {
  data: T | undefined;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  refetch: () => Promise<unknown>;
};

export const VIEW_ACCESS: Record<
  AdminSupportFinanceView,
  { label: string; eyebrow: string; description: string; icon: IconName; roles: AdminStaffRole[] }
> = {
  payments: {
    label: 'پرداخت‌ها',
    eyebrow: 'FINANCE / PAYMENT ATTEMPTS',
    description: 'تلاش‌های پرداخت و بازپرداخت‌های ثبت‌شده را بدون داده‌های حساس بررسی کنید.',
    icon: 'bag',
    roles: ['admin'],
  },
  customers: {
    label: 'مشتریان',
    eyebrow: 'SUPPORT / CUSTOMER LOOKUP',
    description: 'با جست‌وجوی محدود، اطلاعات لازم برای پاسخ‌گویی به مشتری را پیدا کنید.',
    icon: 'users',
    roles: ['support', 'operations', 'admin'],
  },
  notifications: {
    label: 'تحویل اعلان‌ها',
    eyebrow: 'OPERATIONS / DELIVERY INSPECTION',
    description: 'وضعیت تحویل پیام‌ها را بررسی کنید؛ متن خطا و جزئیات داخلی نمایش داده نمی‌شود.',
    icon: 'bell',
    roles: ['operations', 'admin'],
  },
  audit: {
    label: 'گزارش فعالیت',
    eyebrow: 'GOVERNANCE / AUDIT EVENTS',
    description: 'رویدادهای مهم سیستم را برای پیگیری مسئولانه و قابل‌اعتماد مرور کنید.',
    icon: 'eye',
    roles: ['admin'],
  },
};

export const PAYMENT_STATUSES = [
  'PENDING',
  'REDIRECTED',
  'SUCCEEDED',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
] as const;

export const CUSTOMER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;

export const NOTIFICATION_STATUSES = ['PENDING', 'PROCESSING', 'SENT', 'FAILED'] as const;

export const ACTOR_TYPES = ['CUSTOMER', 'STAFF', 'SYSTEM'] as const;

export const faNumber = new Intl.NumberFormat('fa-IR');

export const faDate = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
