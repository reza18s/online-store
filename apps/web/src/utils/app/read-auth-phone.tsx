import { authPhoneStorageKey } from '../../components/app/app-shared';

export function readAuthPhone(): string {
  try {
    return window.sessionStorage.getItem(authPhoneStorageKey) ?? '';
  } catch {
    return '';
  }
}
