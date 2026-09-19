export function adminOrderHref(orderNumber: string): string {
  return `#admin/orders/${encodeURIComponent(orderNumber)}`;
}
