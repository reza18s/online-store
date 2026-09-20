import { customerAddressesPath } from '@/features/account/api/addresses-api-shared';

export function customerAddressPath(addressId: string): string {
  return `${customerAddressesPath}/${encodeURIComponent(addressId)}`;
}
