export function statusLabel(status: string): string {
  return (
    {
      DRAFT: 'پیش‌نویس',
      PUBLISHED: 'منتشرشده',
      ARCHIVED: 'آرشیوشده',
      IN_STOCK: 'موجود',
      LOW_STOCK: 'موجودی کم',
      OUT_OF_STOCK: 'ناموجود',
      ACTIVE: 'فعال',
      INACTIVE: 'غیرفعال',
      ALL: 'همه',
      RECEIPT: 'رسید انبار',
      ADJUSTMENT: 'اصلاح دستی',
      RESERVATION: 'رزرو',
      RELEASE: 'آزادسازی رزرو',
      SALE: 'فروش',
      RETURN: 'مرجوعی',
    }[status] ?? status
  );
}
