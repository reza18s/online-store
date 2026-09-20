export function isStorefrontFakeDataEnabled(): boolean {
  return import.meta.env.DEV;
}
