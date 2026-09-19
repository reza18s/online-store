import type { adminOrderStatusTone } from './admin-order-status-tone';

export function statusBadgeVariant(
  tone: ReturnType<typeof adminOrderStatusTone>,
): 'success' | 'warning' | 'destructive' | 'info' | 'secondary' {
  return tone === 'danger' ? 'destructive' : tone === 'neutral' ? 'secondary' : tone;
}
