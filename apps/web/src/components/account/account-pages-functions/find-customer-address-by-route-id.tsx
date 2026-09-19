import { type CustomerAddress } from '@nova/api-client';

import { decodeAddressRouteId } from './decode-address-route-id';

export function findCustomerAddressByRouteId(
  addresses: CustomerAddress[],
  addressId?: string,
): CustomerAddress | undefined {
  if (!addressId) return addresses.find((item) => item.isDefault) ?? addresses[0];
  const decodedAddressId = decodeAddressRouteId(addressId);
  return addresses.find((item) => item.id === decodedAddressId);
}
