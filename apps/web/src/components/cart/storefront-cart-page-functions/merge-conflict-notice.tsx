import { type CartMergeConflict } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';

import { conflictQuantity } from './conflict-quantity';

export function MergeConflictNotice({
  conflicts,
  onResolve,
  isBusy,
}: {
  conflicts: CartMergeConflict[];
  onResolve: (variantId: string, quantity: number) => void;
  isBusy: boolean;
}) {
  const reasonCopy: Record<CartMergeConflict['reason'], string> = {
    VARIANT_UNAVAILABLE: 'این تنوع دیگر موجود نیست.',
    STOCK_LIMIT: 'تعداد قابل افزودن به موجودی فعلی محدود شد.',
    QUANTITY_LIMIT: 'تعداد این کالا به سقف مجاز رسید.',
  };
  return (
    <section
      className="border border-warning bg-warning-soft p-4"
      role="alert"
      aria-labelledby="cart-merge-conflict-title"
    >
      <div className="flex items-start gap-3">
        <Icon name="warning" size={19} />
        <div>
          <h2 className="font-semibold" id="cart-merge-conflict-title">
            بخشی از سبد مهمان نیازمند بررسی است
          </h2>
          <p className="mt-1 text-sm leading-7">
            ورود انجام شده، اما این موارد بدون تأیید شما ادغام نشدند.
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-3">
        {conflicts.map((conflict) => {
          const nextQuantity = conflictQuantity(conflict);
          return (
            <li
              className="flex flex-wrap items-center justify-between gap-3 border-t border-warning/40 pt-3 text-sm"
              key={conflict.variantId}
            >
              <span>
                <span className="font-mono text-xs" dir="ltr">
                  {conflict.variantId}
                </span>
                <span className="ms-2">{reasonCopy[conflict.reason]}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => onResolve(conflict.variantId, nextQuantity ?? 0)}
              >
                {nextQuantity === null
                  ? 'حذف کالا از سبد مهمان'
                  : `نگه‌داشتن ${new Intl.NumberFormat('fa-IR').format(nextQuantity)} عدد`}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
