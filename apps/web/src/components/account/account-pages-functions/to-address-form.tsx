import { type CustomerAddress } from '@nova/api-client';

import type { AddressFormState } from '../../../pages/account/account-pages-shared';

export function toAddressForm(address: CustomerAddress): AddressFormState {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}
