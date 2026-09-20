export function statusBadgeVariant(
  status: string,
): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (['PUBLISHED', 'IN_STOCK', 'ACTIVE', 'RECEIPT', 'RELEASE', 'RETURN'].includes(status)) {
    return 'success';
  }
  if (['LOW_STOCK', 'DRAFT', 'RESERVATION'].includes(status)) {
    return 'warning';
  }
  if (['OUT_OF_STOCK', 'ARCHIVED', 'INACTIVE'].includes(status)) {
    return 'destructive';
  }
  return 'secondary';
}
