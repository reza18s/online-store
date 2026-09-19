import { ApiClientError } from '@nova/api-client';

import type { PublicContentErrorState } from '../../../pages/content/public-content-system-page-shared';

export function classifyContentError(error: unknown, online = true): PublicContentErrorState {
  if (error instanceof ApiClientError) {
    const code = error.payload?.error.code ?? '';
    if (error.status === 404) return 'missing';
    if (error.status === 503 || /maintenance|unavailable/i.test(code)) return 'maintenance';
  }

  if (!online || (error instanceof TypeError && /fetch|network|load/i.test(error.message))) {
    return 'offline';
  }
  return 'error';
}
