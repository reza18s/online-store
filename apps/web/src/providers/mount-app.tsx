import type { ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { InteractiveApp, StaticSsrHandoff } from './interactive-app';

type AppRenderers = {
  create: (root: HTMLElement, app: ReactNode) => void;
  hydrate: (root: HTMLElement, app: ReactNode) => void;
};

const appRenderers: AppRenderers = {
  create: (element, app) => createRoot(element).render(app),
  hydrate: (element, app) => {
    hydrateRoot(element, app);
  },
};

export function mountApp(rootElement: HTMLElement, renderers: AppRenderers = appRenderers): void {
  const shellElement = rootElement.firstElementChild;
  if (
    rootElement.dataset.novaSsr === 'true' &&
    shellElement?.getAttribute('data-nova-ssr-shell') === 'true'
  ) {
    renderers.hydrate(rootElement, <StaticSsrHandoff shellHtml={shellElement.innerHTML} />);
    return;
  }

  renderers.create(rootElement, <InteractiveApp />);
}
