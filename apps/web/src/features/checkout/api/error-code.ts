import { ApiClientError } from '@nova/api-client';

export function errorCode(error: unknown): string {
  return error instanceof ApiClientError ? (error.payload?.error.code ?? '') : '';
}
