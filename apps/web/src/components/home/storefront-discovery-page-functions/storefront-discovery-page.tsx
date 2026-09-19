import type { StorefrontDiscoveryPageProps } from '../../../pages/catalog/storefront-discovery-page-shared';

import { CategoryDiscovery } from './category-discovery';

import { HomeDiscovery } from './home-discovery';

import { ListingDiscovery } from './listing-discovery';

import { ProductDiscovery } from './product-discovery';

export function StorefrontDiscoveryPage(props: StorefrontDiscoveryPageProps) {
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
