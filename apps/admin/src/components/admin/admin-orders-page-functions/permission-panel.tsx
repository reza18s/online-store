import { StatePanel } from './state-panel';

export function PermissionPanel() {
  return (
    <StatePanel
      icon="warning"
      title="دسترسی عملیات سفارش ندارید"
      description="این بخش فقط برای اعضای مجاز پشتیبانی، عملیات یا مدیر سیستم در دسترس است."
      tone="danger"
    />
  );
}
