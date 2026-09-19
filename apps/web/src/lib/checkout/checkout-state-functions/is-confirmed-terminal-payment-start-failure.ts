import { ApiClientError } from '@nova/api-client';

import { unconfiguredPaymentGatewayMessage } from '../checkout-state-shared';

export function isConfirmedTerminalPaymentStartFailure(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    error.status === 503 &&
    error.payload?.error.code === 'SERVICE_UNAVAILABLE' &&
    error.payload.error.message === unconfiguredPaymentGatewayMessage
  );
}
