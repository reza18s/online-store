import { type ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { LoadingState } from './loading-state';

import { StatePanel } from './state-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { isOfflineError } from './is-offline-error';

export function QueryState({
  pending,
  error,
  hasData,
  empty,
  onRetry,
  children,
}: {
  pending: boolean;
  error: unknown;
  hasData: boolean;
  empty?: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (pending && !hasData) return <LoadingState />;
  if (error && !hasData) {
    const offline = isOfflineError(error);
    return (
      <StatePanel
        icon={offline ? 'refresh' : 'warning'}
        title={offline ? 'اتصال شبکه در دسترس نیست' : 'دریافت اطلاعات انجام نشد'}
        description={
          offline
            ? 'اتصال را بررسی کنید و دوباره تلاش کنید.'
            : adminCatalogInventoryErrorMessage(error, 'اطلاعات فعلاً در دسترس نیست.')
        }
        action={
          <Button onClick={onRetry} variant="outline">
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        }
        tone="danger"
      />
    );
  }
  if (empty) {
    return (
      <StatePanel
        icon="layers"
        title="موردی پیدا نشد"
        description="فیلترها را تغییر دهید یا اولین مورد را از همین نما ثبت کنید."
      />
    );
  }
  return <>{children}</>;
}
