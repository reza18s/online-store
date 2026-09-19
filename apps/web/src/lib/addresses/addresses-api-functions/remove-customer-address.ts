import { apiClient, type CustomerAddress } from '@nova/api-client';

import { customerAddressPath } from './customer-address-path';

export async function removeCustomerAddress(addressId: string): Promise<CustomerAddress[]> {
  const response = await apiClient.deleteEnvelope<CustomerAddress[]>(
    customerAddressPath(addressId),
  );
  return response.data;
}
