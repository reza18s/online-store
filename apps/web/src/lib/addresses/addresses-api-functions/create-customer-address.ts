import { apiClient, type CustomerAddress, type CustomerAddressCreateInput } from '@nova/api-client';

import { customerAddressesPath } from '../addresses-api-shared';

export async function createCustomerAddress(
  input: CustomerAddressCreateInput,
): Promise<CustomerAddress> {
  const response = await apiClient.postEnvelope<CustomerAddress>(customerAddressesPath, input);
  return response.data;
}
