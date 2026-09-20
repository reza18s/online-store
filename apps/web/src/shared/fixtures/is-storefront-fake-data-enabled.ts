type StorefrontEnv = ImportMetaEnv & {
  VITE_ENABLE_STOREFRONT_FAKE_DATA?: string;
};

export function isStorefrontFakeDataEnabled(): boolean {
  const env = import.meta.env as StorefrontEnv;
  return import.meta.env.DEV && env.VITE_ENABLE_STOREFRONT_FAKE_DATA === 'true';
}
