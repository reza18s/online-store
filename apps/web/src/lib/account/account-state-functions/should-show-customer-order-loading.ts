export function shouldShowCustomerOrderLoading({
  customerPending,
  customerActive,
  hasOrderNumber,
  orderPending,
}: {
  customerPending: boolean;
  customerActive: boolean;
  hasOrderNumber: boolean;
  orderPending: boolean;
}): boolean {
  return customerPending || (customerActive && hasOrderNumber && orderPending);
}
