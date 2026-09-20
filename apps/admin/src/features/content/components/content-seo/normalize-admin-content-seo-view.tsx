import type { AdminContentSeoView } from '@/features/content/pages/admin-content-seo-page-shared';

export function normalizeAdminContentSeoView(view: string | undefined): AdminContentSeoView {
  if (view === 'seo' || view === 'redirects') return view;
  return 'content';
}
