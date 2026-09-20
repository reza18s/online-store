import { ApiClientError } from '@nova/api-client';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError && error.payload?.error.message) {
    return error.payload.error.message;
  }
  return error instanceof Error ? error.message : fallback;
}
