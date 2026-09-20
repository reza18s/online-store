import { ApiClientError } from '@nova/api-client';

export function isStaffAuthorizationFailure(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 403;
}
