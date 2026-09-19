import { type AdminDashboardSummary } from '@nova/api-client';

import { type IconName } from '../../components/ui/icon';

import { formatPersianNumber } from '../../components/admin/admin-dashboard-page-functions/format-persian-number';
import { formatToman } from '../../components/admin/admin-dashboard-page-functions/format-toman';

export const PERIOD_OPTIONS = [
  { value: 7, label: '۷ روز گذشته' },
  { value: 30, label: '۳۰ روز گذشته' },
  { value: 90, label: '۹۰ روز گذشته' },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  RETURNED: 'مرجوع شده',
};

export const SUMMARY_METRICS: Array<{
  key: keyof Pick<
    AdminDashboardSummary,
    | 'publishedProductCount'
    | 'newCustomerCount'
    | 'newOrderCount'
    | 'paidGrossToman'
    | 'successfulRefundToman'
  >;
  label: string;
  icon: IconName;
  format: (value: number) => string;
}> = [
  {
    key: 'publishedProductCount',
    label: 'محصولات منتشرشده',
    icon: 'package',
    format: formatPersianNumber,
  },
  {
    key: 'newCustomerCount',
    label: 'مشتریان جدید',
    icon: 'user',
    format: formatPersianNumber,
  },
  {
    key: 'newOrderCount',
    label: 'سفارش‌های جدید',
    icon: 'bag',
    format: formatPersianNumber,
  },
  {
    key: 'paidGrossToman',
    label: 'مجموع پرداخت موفق',
    icon: 'tag',
    format: formatToman,
  },
  {
    key: 'successfulRefundToman',
    label: 'بازپرداخت موفق',
    icon: 'arrow-left',
    format: formatToman,
  },
];
