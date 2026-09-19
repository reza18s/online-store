import { apiClient, type CustomerAddress } from '@nova/api-client';

import { customerAddressDefaultPath } from './customer-address-default-path';

export async function setCustomerAddressDefault(addressId: string): Promise<CustomerAddress> {
  const response = await apiClient.postEnvelope<CustomerAddress>(
    customerAddressDefaultPath(addressId),
  );
  return response.data;
}
