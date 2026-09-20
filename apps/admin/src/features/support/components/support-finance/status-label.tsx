export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'در انتظار',
    PROCESSING: 'در حال پردازش',
    REDIRECTED: 'هدایت‌شده',
    SUCCEEDED: 'موفق',
    EXPIRED: 'منقضی‌شده',
    SENT: 'ارسال‌شده',
    FAILED: 'ناموفق',
    CANCELLED: 'لغوشده',
    ACTIVE: 'فعال',
    SUSPENDED: 'معلق',
    DELETED: 'حذف‌شده',
    PENDING_PAYMENT: 'در انتظار پرداخت',
    CONFIRMED: 'تأییدشده',
    PREPARING: 'در حال آماده‌سازی',
    SHIPPED: 'ارسال‌شده',
    DELIVERED: 'تحویل‌شده',
    RETURNED: 'مرجوع‌شده',
    PAID: 'پرداخت‌شده',
    REFUNDED: 'بازپرداخت‌شده',
    CUSTOMER: 'مشتری',
    STAFF: 'کارمند',
    SYSTEM: 'سیستم',
  };
  return labels[status] ?? 'نامشخص';
}
