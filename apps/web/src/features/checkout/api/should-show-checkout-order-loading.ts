export function shouldShowCheckoutOrderLoading(
  orderNumber: string,
  orderPending: boolean,
): boolean {
  return Boolean(orderNumber) && orderPending;
}
