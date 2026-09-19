import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { formatNumber } from './format-number';

import { pageCount } from './page-count';

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const pages = pageCount(total, limit);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[11px] text-muted-foreground">
      <span>
        صفحه {formatNumber(page)} از {formatNumber(pages)} · {formatNumber(total)} نتیجه
      </span>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          aria-label="صفحه قبل"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <Icon name="arrow-left" size={16} />
        </Button>
        <span className="min-w-11 text-center" dir="rtl">
          {formatNumber(page)}
        </span>
        <Button
          aria-label="صفحه بعد"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <Icon name="arrow-right" size={16} />
        </Button>
      </div>
    </div>
  );
}
