import { SAFE_TRACKING_PATTERN } from '../../../pages/admin/admin-orders-page-shared';

export function isSafeTrackingReference(value: string): boolean {
  return SAFE_TRACKING_PATTERN.test(value);
}
