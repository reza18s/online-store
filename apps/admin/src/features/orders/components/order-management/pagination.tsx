import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label="صفحه‌های سفارش‌ها"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
    >
      <span className="text-xs text-muted-foreground">
        صفحه {formatPersianNumber(page)} از {formatPersianNumber(pageCount)}
      </span>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          aria-label="صفحه قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon"
          variant="outline"
        >
          <Icon name="arrow-left" size={18} />
        </Button>
        <Button
          aria-label="صفحه بعد"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          size="icon"
          variant="outline"
        >
          <Icon name="arrow-right" size={18} />
        </Button>
      </div>
    </nav>
  );
}
