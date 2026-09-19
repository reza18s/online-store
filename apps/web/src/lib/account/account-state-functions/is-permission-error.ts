import { ApiClientError } from '@nova/api-client';

export function isPermissionError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 403;
}
