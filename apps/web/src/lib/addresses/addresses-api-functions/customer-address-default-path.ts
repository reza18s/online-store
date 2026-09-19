import { customerAddressPath } from './customer-address-path';

export function customerAddressDefaultPath(addressId: string): string {
  return `${customerAddressPath(addressId)}/default`;
}
