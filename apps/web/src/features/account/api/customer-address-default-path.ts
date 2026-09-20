import { customerAddressPath } from '@/features/account/api/customer-address-path';

export function customerAddressDefaultPath(addressId: string): string {
  return `${customerAddressPath(addressId)}/default`;
}
