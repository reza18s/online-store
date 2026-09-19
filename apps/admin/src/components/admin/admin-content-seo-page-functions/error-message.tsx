import { adminContentSeoErrorMessage } from './admin-content-seo-error-message';

export function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div
      className="rounded-control border border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-7 text-warning"
      role="alert"
    >
      {adminContentSeoErrorMessage(error)}
    </div>
  );
}
