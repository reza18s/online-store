import { type CheckoutRequestInput } from '@nova/api-client';
import { Button } from '@nova/ui';

import { type CheckoutFailure } from '../../../lib/checkout/checkout-state';
import { Icon } from '../../ui/icon';

import { failureHref } from './failure-href';

export function FailurePanel({
  failure,
  input,
  onRetry,
}: {
  failure: CheckoutFailure;
  input: CheckoutRequestInput;
  onRetry?: () => void;
}) {
  const href = failureHref(failure, input);
  return (
    <div className="mt-5 border border-danger/30 bg-danger/5 p-4" role="alert">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-danger" aria-hidden="true">
          <Icon name="warning" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{failure.title}</h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">{failure.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {onRetry ? (
              <Button type="button" variant="outline" onClick={onRetry}>
                {failure.actionLabel}
              </Button>
            ) : href ? (
              <Button asChild type="button" variant="outline">
                <a href={href}>{failure.actionLabel}</a>
              </Button>
            ) : null}
            {failure.action !== 'cart' && failure.action !== 'login' ? (
              <a className="text-link" href="#cart">
                بازگشت به سبد
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
