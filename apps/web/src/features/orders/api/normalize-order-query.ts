import { type CustomerOrderListQuery } from '@nova/api-client';

export function normalizeOrderQuery(query: CustomerOrderListQuery = {}): CustomerOrderListQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as CustomerOrderListQuery;
}
