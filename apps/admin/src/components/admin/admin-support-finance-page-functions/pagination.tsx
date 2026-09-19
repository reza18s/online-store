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
  if (pages <= 1) {
    return <p className="text-[11px] text-muted-foreground">{formatNumber(total)} نتیجه</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-[11px] text-muted-foreground">
        صفحه {formatNumber(page)} از {formatNumber(pages)} · {formatNumber(total)} نتیجه
      </p>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          aria-label="صفحه قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="arrow-left" size={16} />
        </Button>
        <span className="min-w-11 text-center text-xs" dir="rtl">
          {formatNumber(page)}
        </span>
        <Button
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          aria-label="صفحه بعد"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <Icon name="arrow-right" size={16} />
        </Button>
      </div>
    </div>
  );
}
