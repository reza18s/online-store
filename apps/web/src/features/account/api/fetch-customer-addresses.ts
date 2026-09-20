import { apiClient, type CustomerAddress } from '@nova/api-client';

import { customerAddressesPath } from '@/features/account/api/addresses-api-shared';

export async function fetchCustomerAddresses(): Promise<CustomerAddress[]> {
  const response = await apiClient.getEnvelope<CustomerAddress[]>(customerAddressesPath);
  return response.data;
}
