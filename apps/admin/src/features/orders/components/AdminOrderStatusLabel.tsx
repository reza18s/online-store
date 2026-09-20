import type { AdminOrderSummary } from '@nova/api-client';

export function adminOrderStatusLabel(status: AdminOrderSummary['status']): string {
  const labels: Record<AdminOrderSummary['status'], string> = {
    PENDING_PAYMENT: 'در انتظار پرداخت',
    CONFIRMED: 'تایید شده',
    PREPARING: 'در حال آماده‌سازی',
    SHIPPED: 'ارسال شده',
    DELIVERED: 'تحویل شده',
    CANCELLED: 'لغو شده',
    RETURNED: 'مرجوع شده',
  };
  return labels[status];
}
