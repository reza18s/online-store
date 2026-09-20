export function adminOrderStatusTone(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (['DELIVERED', 'RETURNED', 'RECEIVED', 'REFUNDED', 'SUCCEEDED'].includes(status)) {
    return 'success';
  }
  if (['PENDING_PAYMENT', 'PREPARING', 'DELAYED', 'REQUESTED', 'PENDING'].includes(status)) {
    return 'warning';
  }
  if (['CANCELLED', 'EXCEPTION', 'REJECTED', 'FAILED'].includes(status)) return 'danger';
  if (['SHIPPED', 'CONFIRMED', 'APPROVED'].includes(status)) return 'info';
  return 'neutral';
}
