import { ApiClientError } from '@nova/api-client';

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}
