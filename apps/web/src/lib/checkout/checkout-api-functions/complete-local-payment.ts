import { apiClient, type PaymentCallbackResponse } from '@nova/api-client';

import { localPaymentCallbackPath } from '../checkout-api-shared';

export async function completeLocalPayment(input: {
  orderNumber: string;
  amountToman: number;
  transactionId: string;
  token: string;
}): Promise<PaymentCallbackResponse> {
  const params = new URLSearchParams({
    orderNumber: input.orderNumber,
    amountToman: String(input.amountToman),
    transactionId: input.transactionId,
    token: input.token,
  });
  const response = await apiClient.getEnvelope<PaymentCallbackResponse>(
    `${localPaymentCallbackPath}?${params.toString()}`,
  );
  return response.data;
}
