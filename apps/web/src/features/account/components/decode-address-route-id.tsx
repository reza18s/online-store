export function decodeAddressRouteId(addressId: string): string {
  try {
    return decodeURIComponent(addressId);
  } catch {
    return addressId;
  }
}
