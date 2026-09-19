import { Icon } from '../ui/icon';

import { products } from '../app/app-shared';

export function AdminPopularProducts() {
  const sales = ['نمونه', 'نمونه', 'نمونه', 'نمونه', 'نمونه'];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="popular-products-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="popular-products-title" className="text-base md:text-lg">
          محصولات پرفروش
        </h2>
        <a className="text-link text-xs" href="#admin/products">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {products.slice(0, 5).map((product, index) => (
          <a
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
            href={`#product/${product.slug}`}
            key={product.slug}
          >
            <img
              className="h-11 w-11 shrink-0 rounded-md bg-background object-contain p-1"
              src={product.image}
              alt=""
            />
            <span className="min-w-0 flex-1 text-right">
              <strong className="block truncate text-xs font-medium">{product.name}</strong>
              <small className="mt-1 block text-[10px] text-muted-foreground">
                {sales[index] ?? '۱۲۴'} فروش
              </small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
