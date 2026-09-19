import { Button } from '@nova/ui';

import { Icon } from '../../../components/ui/icon';
import {
  apiErrorMessage,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
} from '../../../lib/account/account-state';

export function InlineQueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const offline = isOfflineError(error);
  return (
    <div className="inline-message inline-message--error" role="alert">
      <Icon name={offline ? 'refresh' : 'warning'} size={16} />
      <span>
        {offline
          ? 'اتصال برقرار نیست؛ اطلاعات خصوصی شما پس از اتصال دوباره بارگذاری می‌شود.'
          : isPermissionError(error)
            ? 'دسترسی به این اطلاعات ممکن نیست.'
            : apiErrorMessage(error, 'دریافت اطلاعات انجام نشد.')}
      </span>
      {!isPermissionError(error) && !isUnauthorizedError(error) ? (
        <Button
          className="mr-auto min-h-8 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onRetry}
          type="button"
        >
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}
