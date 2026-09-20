import type { StorefrontDiscoveryPageProps } from '@/features/catalog/pages/storefront-discovery-page-shared';

import { CategoryDiscovery } from '@/features/catalog/components/category-discovery';

import { HomeDiscovery } from '@/features/catalog/components/home-discovery';

import { ListingDiscovery } from '@/features/catalog/components/listing-discovery';

import { ProductDiscovery } from '@/features/catalog/components/product-discovery';

export function DiscoveryView(props: StorefrontDiscoveryPageProps) {
  switch (props.view) {
    case 'home':
      return <HomeDiscovery props={props} />;
    case 'category':
      return <CategoryDiscovery props={props} />;
    case 'product':
      return <ProductDiscovery props={props} />;
    case 'listing':
    case 'search':
      return <ListingDiscovery props={props} />;
  }
}
