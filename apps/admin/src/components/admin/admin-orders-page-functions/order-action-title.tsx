import type { PendingAction } from '../../../pages/admin/admin-orders-page-shared';

import { adminOrderStatusLabel } from './admin-order-status-label';

export function orderActionTitle(action: PendingAction): string {
  if (action.kind === 'status') return `تغییر وضعیت به «${adminOrderStatusLabel(action.target)}»`;
  if (action.kind === 'shipment') return 'ثبت یا به‌روزرسانی ارسال';
  return action.target === 'RECEIVED'
    ? 'تأیید دریافت و شروع بازپرداخت'
    : `${action.target === 'APPROVED' ? 'تأیید' : 'رد'} درخواست بازگشت`;
}
