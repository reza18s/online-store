import { apiClient, type CustomerAddress, type CustomerAddressUpdateInput } from '@nova/api-client';

import { customerAddressPath } from './customer-address-path';

export async function updateCustomerAddress(
  addressId: string,
  input: CustomerAddressUpdateInput,
): Promise<CustomerAddress> {
  const response = await apiClient.patchEnvelope<CustomerAddress>(
    customerAddressPath(addressId),
    input,
  );
  return response.data;
}
