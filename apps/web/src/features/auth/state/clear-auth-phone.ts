import { authPhoneStorageKey } from '@/app/app-shared';

export function clearAuthPhone(): void {
  try {
    window.sessionStorage.removeItem(authPhoneStorageKey);
  } catch {
    // Session storage can be unavailable in privacy-restricted browser contexts.
  }
}
