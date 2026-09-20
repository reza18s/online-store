import { ApiClientError } from '@nova/api-client';

export function errorText(error: unknown): string {
  return error instanceof ApiClientError && error.payload?.error.message
    ? error.payload.error.message
    : error instanceof Error
      ? error.message
      : '';
}
