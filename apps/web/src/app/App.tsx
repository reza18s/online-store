import { useEffect, useState } from 'react';

import { useCurrentCustomer } from '@/features/auth';

import { navigateToRoute, useRoute, useScrollToTop } from '@/app/routing/route';
import { Header, MenuDrawer, MobileBottomNav, SearchDialog } from '@/shared/ui/site-shell';
import { applySeoDocument, readInitialRenderContext } from '@/features/seo';

import { useCart } from '@/features/cart';
import { useCatalogCategories } from '@/features/catalog/api/catalog-api';
import { rememberRecentSearch } from '@/features/catalog/recent-searches';

import { PublicApp } from '@/app/PublicApp';

import { resolveSeoDocumentForRoute } from '@/features/seo';

export function App() {
  const route = useRoute();
  const [pathname, queryString = ''] = route.split('?');
  const categoryAudience =
    pathname === '/category/women' ||
    pathname === '/category/men' ||
    pathname === '/category/children'
      ? (pathname.slice('/category/'.length) as 'women' | 'men' | 'children')
      : undefined;
  const searchQuery =
    pathname === '/search' ? (new URLSearchParams(queryString).get('q') ?? '') : undefined;
  useScrollToTop(route);
  const cartQuery = useCart(true);
  const customerQuery = useCurrentCustomer(true);
  const categoriesQuery = useCatalogCategories();
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
    if (pathname === '/search') setSearchOpen(true);
  }, [route]);

  const submitHeaderSearch = (term: string) => {
    const normalizedQuery = term.trim();
    if (!normalizedQuery) return;

    rememberRecentSearch(normalizedQuery);
    navigateToRoute('/products?q=' + encodeURIComponent(normalizedQuery));
  };

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
        onSearchSubmit={submitHeaderSearch}
        onMenu={() => setMenuOpen(true)}
        categoryAudience={categoryAudience}
        quickCategories={categoriesQuery.data ?? []}
        isCategoryNavLoading={categoriesQuery.isPending}
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
      <MobileBottomNav cartCount={cartCount} categoryAudience={categoryAudience} />
      <SearchDialog
        open={searchOpen}
        initialQuery={searchQuery}
        onClose={() => setSearchOpen(false)}
      />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
