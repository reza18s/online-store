import { useEffect, useState } from 'react';

import { useCurrentCustomer } from '@/features/auth';

import { useHashRoute, useScrollToTop } from '@/app/routing/hash-route';
import { Header, MenuDrawer, MobileBottomNav, SearchDialog } from '@/shared/ui/site-shell';
import { applySeoDocument, readInitialRenderContext } from '@/features/seo';

import { useCart } from '@/features/cart';

import { PublicApp } from '@/app/PublicApp';

import { resolveSeoDocumentForRoute } from '@/features/seo';

export function App() {
  const route = useHashRoute();
  useScrollToTop(route);
  const cartQuery = useCart(true);
  const customerQuery = useCurrentCustomer(true);
  const cart = cartQuery.data;
  const cartCount = cart?.itemCount ?? 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const seo = resolveSeoDocumentForRoute(
      route,
      readInitialRenderContext(),
      window.location.pathname,
      window.location.origin,
    );
    applySeoDocument(document, seo);
  }, [route]);

  useEffect(() => {
    if (route === '#search') setSearchOpen(true);
  }, [route]);

  const toggleWishlist = (slug: string) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className="app-root min-h-svh bg-background" dir="rtl">
      <Header
        cartCount={cartCount}
        onSearch={() => setSearchOpen(true)}
        onMenu={() => setMenuOpen(true)}
      />
      <PublicApp
        route={route}
        cart={cart}
        cartLoading={cartQuery.isPending}
        cartError={cartQuery.isError}
        onRetryCart={() => void cartQuery.refetch()}
        customerId={customerQuery.data?.id}
        isWishlisted={(slug) => wishlist.has(slug)}
        onToggleWishlist={toggleWishlist}
      />
      <MobileBottomNav cartCount={cartCount} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
