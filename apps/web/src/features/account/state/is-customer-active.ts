import { type CustomerUser } from '@nova/api-client';

export function isCustomerActive(
  customer: CustomerUser | null | undefined,
): customer is CustomerUser {
  return Boolean(customer && customer.status === 'ACTIVE');
}
