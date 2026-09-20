export function safeAuditMetadataLabel(metadata: unknown): string {
  if (metadata === null || metadata === undefined) return 'جزئیات محدودشده‌ای ثبت نشده';
  return 'جزئیات رویداد در این نما محدود شده است';
}
