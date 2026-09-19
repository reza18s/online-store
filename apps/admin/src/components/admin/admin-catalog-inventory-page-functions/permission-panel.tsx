import { StatePanel } from './state-panel';

export function PermissionPanel({ title = 'دسترسی کافی ندارید' }: { title?: string }) {
  return (
    <StatePanel
      icon="warning"
      title={title}
      description="این بخش برای نقش فعلی شما فعال نیست."
      tone="danger"
    />
  );
}
