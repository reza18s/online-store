import { Button } from '@nova/ui';

import { useStaffLogout } from '../../lib/admin/admin-catalog-api';

import { Icon } from '../ui/icon';

export function AdminLogoutButton({
  className = '',
  compact = false,
  label = 'خروج از حساب',
}: {
  className?: string;
  compact?: boolean;
  label?: string;
}) {
  const logoutMutation = useStaffLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        window.location.hash = '#admin/login';
      },
    });
  };

  return (
    <Button
      className={className}
      type="button"
      disabled={logoutMutation.isPending}
      aria-busy={logoutMutation.isPending}
      aria-label={compact ? label : undefined}
      onClick={handleLogout}
    >
      <Icon name="arrow-right" size={17} />
      {compact ? (
        <span className="sr-only">{logoutMutation.isPending ? 'در حال خروج...' : label}</span>
      ) : logoutMutation.isPending ? (
        'در حال خروج...'
      ) : (
        label
      )}
    </Button>
  );
}
