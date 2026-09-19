import { authPhoneStorageKey } from '../../components/app/app-shared';

export function writeAuthPhone(phone: string): void {
  try {
    window.sessionStorage.setItem(authPhoneStorageKey, phone);
  } catch {
    // Session storage can be unavailable in privacy-restricted browser contexts.
  }
}
