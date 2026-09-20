import { PAYMENT_ATTEMPT_STATUS_LABELS } from '@/features/orders/pages/admin-orders-page-shared';

export function adminPaymentAttemptStatusLabel(status: string): string {
  return PAYMENT_ATTEMPT_STATUS_LABELS[status] ?? status;
}
