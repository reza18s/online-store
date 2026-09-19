import { Icon, type IconName } from '../../ui/icon';

import type { AdminContentSeoView } from '../../../pages/admin/admin-content-seo-page-shared';

export function AdminContentSeoNavigation({ activeView }: { activeView: AdminContentSeoView }) {
  const items: Array<[AdminContentSeoView, string, IconName]> = [
    ['content', 'محتوا', 'book'],
    ['seo', 'متادیتای SEO', 'sparkles'],
    ['redirects', 'redirectها', 'rotate'],
  ];
  return (
    <nav className="overflow-x-auto" aria-label="بخش‌های محتوا و SEO">
      <div className="flex min-w-max gap-2">
        {items.map(([view, label, icon]) => (
          <a
            key={view}
            href={`#admin/${view === 'content' ? 'content' : `content/${view}`}`}
            aria-current={activeView === view ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${activeView === view ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
          >
            <Icon name={icon} size={17} />
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
