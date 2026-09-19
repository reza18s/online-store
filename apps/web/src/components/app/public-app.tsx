import { parseHashRoute, decodeHashSegment } from '../../hooks/routing/hash-route';

import { StorefrontDiscoveryPage } from '../../pages/catalog/storefront-discovery-page';
import { StorefrontCartPage } from '../../pages/cart/storefront-cart-page';
import {
  CheckoutConfirmationPage,
  CheckoutPage as StorefrontCheckoutPage,
  CheckoutPaymentRecoveryPage,
  LocalPaymentPage,
} from '../../pages/checkout/checkout-page';
import {
  CustomerAccountPage,
  CustomerAddressBookPage,
  CustomerOrderPage,
  CustomerReturnPage,
} from '../../lib/account';
import { PublicContentSystemPage } from '../../pages/content/public-content-system-page';

import type { RouteViewProps } from './app-shared';

import { AuthPage } from '../auth/auth-page';

import { NotFoundPage } from '../ui/not-found-page';

import { PreviewStatePage } from '../ui/preview-state-page';

export function PublicApp({
  route,
  cart,
  cartLoading,
  cartError,
  onRetryCart,
  customerId,
  isWishlisted,
  onToggleWishlist,
}: RouteViewProps) {
  const resolved = parseHashRoute(route);

  switch (resolved.kind) {
    case 'home':
      return (
        <StorefrontDiscoveryPage
          view="home"
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'auth-request':
      return <AuthPage mode="request" />;
    case 'auth-verify':
      return <AuthPage mode="verify" queryString={resolved.queryString} />;
    case 'category':
      return (
        <StorefrontDiscoveryPage
          view="category"
          audience={resolved.audience}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'products':
      return (
        <StorefrontDiscoveryPage
          view="listing"
          audience={resolved.audience}
          mode={
            resolved.mode === 'new' || resolved.mode === 'sale' || resolved.mode === 'accessories'
              ? resolved.mode
              : undefined
          }
          queryString={resolved.queryString}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'product':
      return (
        <StorefrontDiscoveryPage
          view="product"
          slug={decodeHashSegment(resolved.slug)}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'cart':
      return (
        <StorefrontCartPage
          cart={cart}
          isLoading={cartLoading}
          isError={cartError}
          onRetry={onRetryCart}
          customerId={customerId}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'preview-state':
      if (resolved.state === 'payment-recovery') {
        return <CheckoutPaymentRecoveryPage queryString={resolved.queryString} />;
      }
      return <PreviewStatePage state={resolved.state} />;
    case 'checkout-confirmation':
      return <CheckoutConfirmationPage queryString={resolved.queryString} />;
    case 'local-payment':
      return <LocalPaymentPage queryString={resolved.queryString} />;
    case 'checkout':
      return (
        <StorefrontCheckoutPage
          step={resolved.step}
          queryString={resolved.queryString}
          cart={cart}
          cartLoading={cartLoading}
          cartError={cartError}
          onRetryCart={onRetryCart}
        />
      );
    case 'account':
      return <CustomerAccountPage section={resolved.section} />;
    case 'address-list':
      return <CustomerAddressBookPage />;
    case 'address-create':
      return <CustomerAddressBookPage mode="create" />;
    case 'address-edit':
      return <CustomerAddressBookPage mode="edit" addressId={resolved.addressId} />;
    case 'order':
      return <CustomerOrderPage orderNumber={resolved.orderNumber} />;
    case 'return':
      return (
        <CustomerReturnPage
          mode={resolved.status ? 'status' : undefined}
          orderNumber={new URLSearchParams(resolved.queryString).get('orderNumber') ?? ''}
        />
      );
    case 'editorial':
      return <PublicContentSystemPage slug={resolved.page} />;
    case 'content':
      return <PublicContentSystemPage slug={resolved.slug} />;
    case 'not-found':
      return <NotFoundPage />;
    default:
      return <NotFoundPage />;
  }
}
