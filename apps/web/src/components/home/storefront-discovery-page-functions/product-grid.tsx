import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';

import { ProductCard } from './product-card';

export function ProductGrid({
  products,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: {
  products: StorefrontProduct[];
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: StorefrontProduct) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          isWishlisted={isWishlisted(product.slug)}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}
