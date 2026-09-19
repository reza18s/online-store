import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';

import type { PublicContentViewState } from '../../../pages/content/public-content-system-page-shared';
import { stateCopy } from '../../../pages/content/public-content-system-page-shared';

import { PageShell } from './page-shell';

export function SystemStatePanel({
  state,
  onRetry,
}: {
  state: Exclude<PublicContentViewState, 'published' | 'empty' | 'unsupported'>;
  onRetry?: () => void;
}) {
  const copy = stateCopy[state];
  return (
    <PageShell>
      <section
        className="empty-state min-h-[min(60svh,520px)] rounded-editorial px-5 py-12 sm:px-8"
        role={state === 'loading' ? 'status' : 'alert'}
        aria-live="polite"
      >
        <span className="section-heading__eyebrow">{copy.eyebrow}</span>
        <span className="empty-state__icon" aria-hidden="true">
          <Icon name={copy.icon} size={25} />
        </span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {copy.retry && onRetry ? (
            <Button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-editorial bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
              type="button"
              onClick={onRetry}
            >
              <Icon name="refresh" size={17} />
              تلاش دوباره
            </Button>
          ) : null}
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-editorial border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-none motion-reduce:transition-none"
            href="#home"
          >
            بازگشت به خانه
          </a>
        </div>
      </section>
    </PageShell>
  );
}
