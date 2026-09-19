export function statusBadgeVariant(
  status: string,
): 'success' | 'destructive' | 'warning' | 'secondary' {
  if (status === 'SUCCEEDED' || status === 'SENT' || status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'DELETED') {
    return 'destructive';
  }
  if (status === 'PROCESSING' || status === 'PENDING' || status === 'SUSPENDED') {
    return 'warning';
  }
  return 'secondary';
}
