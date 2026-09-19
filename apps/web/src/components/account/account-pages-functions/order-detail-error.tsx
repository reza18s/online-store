import {
  apiErrorMessage,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
} from '../../../lib/account/account-state';

import { EmptyState } from './empty-state';

import { PageFrame } from '../../../pages/account/account-pages-functions/page-frame';

export function OrderDetailError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const needsLogin = isUnauthorizedError(error);
  const offline = isOfflineError(error);
  return (
    <PageFrame>
      <EmptyState
        title={
          needsLogin
            ? 'نشست شما منقضی شده است'
            : offline
              ? 'اتصال اینترنت برقرار نیست'
              : isPermissionError(error)
                ? 'این سفارش قابل مشاهده نیست'
                : 'سفارش بارگذاری نشد'
        }
        description={
          needsLogin
            ? 'برای دیدن اطلاعات سفارش دوباره وارد حساب شوید.'
            : offline
              ? 'پس از اتصال دوباره، جزئیات سفارش را دریافت کنید.'
              : apiErrorMessage(error, 'این سفارش پیدا نشد یا دیگر در حساب شما قابل مشاهده نیست.')
        }
        action={needsLogin ? 'ورود دوباره' : 'تلاش دوباره'}
        href={needsLogin ? '#auth' : '#account/orders'}
        onAction={needsLogin || isPermissionError(error) ? undefined : onRetry}
        icon={offline ? 'refresh' : needsLogin ? 'user' : 'warning'}
      />
    </PageFrame>
  );
}
