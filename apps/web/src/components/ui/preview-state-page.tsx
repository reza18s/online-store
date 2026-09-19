import { Button } from '@nova/ui';

import { Icon } from './icon';
import { type PreviewState } from '../../hooks/routing/hash-route';

import { previewStateCopy } from '../app/app-shared';

export function PreviewStatePage({ state }: { state: PreviewState }) {
  const copy = previewStateCopy[state];
  return (
    <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
      <section className="w-full max-w-2xl border border-border bg-surface px-6 py-14 text-center shadow-card md:px-12">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Icon name={copy.icon} size={27} />
        </span>
        <span className="section-heading__eyebrow">{copy.eyebrow}</span>
        <h1 className="mx-auto mt-2 max-w-xl text-3xl leading-relaxed">{copy.title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-muted-foreground">
          {copy.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
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
