export function Pagination({
  page,
  limit,
  total,
  hrefForPage,
}: {
  page: number;
  limit: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (pageCount <= 1) return null;
  const pages = [
    ...new Set(
      [1, page - 1, page, page + 1, pageCount].filter((value) => value >= 1 && value <= pageCount),
    ),
  ].sort((a, b) => a - b);
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="صفحه‌بندی محصولات"
    >
      {page > 1 ? (
        <a
          className="inline-flex min-h-11 items-center border border-border bg-surface px-3 text-xs hover:border-primary"
          href={hrefForPage(page - 1)}
        >
          قبلی
        </a>
      ) : null}
      {pages.map((value, index) => (
        <span className="inline-flex items-center gap-2" key={value}>
          {pages[index - 1] !== undefined && value - pages[index - 1]! > 1 ? (
            <span aria-hidden="true">…</span>
          ) : null}
          <a
            className={`inline-flex h-11 min-w-11 items-center justify-center border px-3 text-xs ${value === page ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:border-primary'}`}
            href={hrefForPage(value)}
            aria-current={value === page ? 'page' : undefined}
          >
            {new Intl.NumberFormat('fa-IR').format(value)}
          </a>
        </span>
      ))}
      {page < pageCount ? (
        <a
          className="inline-flex min-h-11 items-center border border-border bg-surface px-3 text-xs hover:border-primary"
          href={hrefForPage(page + 1)}
        >
          بعدی
        </a>
      ) : null}
    </nav>
  );
}
