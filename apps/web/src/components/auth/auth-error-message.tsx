import { apiErrorMessage } from '../ui/api-error-message';

export function authErrorMessage(error: unknown): string {
  return apiErrorMessage(error, 'ورود انجام نشد؛ دوباره تلاش کنید.');
}
