import { type ReactNode } from 'react';

import type { QueryResult } from '../../../pages/admin/admin-support-finance-page-shared';

import { LoadingRows } from './loading-rows';

import { StateCard } from './state-card';

import { isOfflineError } from './is-offline-error';

export function QueryState<T>({
  query,
  emptyTitle,
  emptyDescription,
  children,
}: {
  query: QueryResult<T>;
  emptyTitle: string;
  emptyDescription: string;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <LoadingRows />;
  if (query.isError) {
    const offline = isOfflineError(query.error);
    return (
      <StateCard
        icon={offline ? 'refresh' : 'warning'}
        title={offline ? 'اتصال شبکه در دسترس نیست' : 'دریافت اطلاعات انجام نشد'}
        description={
          offline
            ? 'اتصال را بررسی کنید و برای دریافت دوباره اطلاعات تلاش کنید.'
            : 'اطلاعات فعلاً در دسترس نیست؛ می‌توانید دوباره تلاش کنید.'
        }
        action="تلاش دوباره"
        onAction={() => void query.refetch()}
        role="alert"
      />
    );
  }
  if (!query.data) return null;
  const items = query.data as { items?: unknown[] };
  if (Array.isArray(items.items) && items.items.length === 0) {
    return (
      <StateCard icon="layers" title={emptyTitle} description={emptyDescription} role="status" />
    );
  }
  return <>{children(query.data)}</>;
}
