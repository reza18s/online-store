import { customerAddressesPath } from '../addresses-api-shared';

export function customerAddressPath(addressId: string): string {
  return `${customerAddressesPath}/${encodeURIComponent(addressId)}`;
}
