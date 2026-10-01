import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { type PreviewState } from '@/app/routing/route';

import { previewStateCopy } from '@/app/app-shared';

export function PreviewStatePage({ state }: { state: PreviewState }) {
  const copy = previewStateCopy[state];
  return (
    <main className="shell system-page">
      <section className="system-card">
        <span className="system-card__icon">
          <Icon name={copy.icon} size={27} />
        </span>
        <span className="section-heading__eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>
          {copy.description}
        </p>
        <div className="system-card__actions">
          <Button asChild size="lg">
            <a href={copy.primaryHref}>
              {copy.primary} <Icon name="arrow-left" size={17} />
            </a>
          </Button>
          {copy.secondary && copy.secondaryHref ? (
            <Button asChild size="lg" variant="outline">
              <a href={copy.secondaryHref}>{copy.secondary}</a>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
