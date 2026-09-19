import type { AddressFormState } from '../../../pages/account/account-pages-shared';

export function addressFormIsComplete(form: AddressFormState): boolean {
  return [
    form.label,
    form.recipientName,
    form.phone,
    form.province,
    form.city,
    form.addressLine,
    form.postalCode,
  ].every((value) => value.trim().length > 0);
}
