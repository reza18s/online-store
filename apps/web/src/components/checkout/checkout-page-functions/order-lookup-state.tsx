import { ApiClientError } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { errorFailure } from './error-failure';

export function OrderLookupState({ error, retry }: { error: unknown; retry: () => void }) {
  const failure = errorFailure(error, 'وضعیت سفارش دریافت نشد.');
  const needsLogin = error instanceof ApiClientError && error.status === 401;
  return (
    <section className="confirmation-card" role="alert">
      <Icon name="warning" size={28} />
      <h1>{needsLogin ? 'برای مشاهده نتیجه وارد شوید' : failure.title}</h1>
      <p>{needsLogin ? 'سفارش فقط برای حساب صاحب آن قابل مشاهده است.' : failure.message}</p>
      <div className="confirmation-card__actions">
        <Button asChild size="lg">
          <a href={needsLogin ? '#auth' : '#account/orders'}>
            {needsLogin ? 'ورود به حساب' : 'مشاهده سفارش‌ها'}
          </a>
        </Button>
        {!needsLogin ? (
          <Button type="button" variant="outline" size="lg" onClick={retry}>
            تلاش دوباره
          </Button>
        ) : null}
      </div>
    </section>
  );
}
