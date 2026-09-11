import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, type ReactNode, useEffect, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import '@nova/ui/styles.css';

import { App } from './app';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

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

function InteractiveApp() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

function StaticSsrHandoff({ shellHtml }: { shellHtml: string }) {
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    setInteractive(true);
  }, []);

  if (!interactive) {
    return <div data-nova-ssr-shell="true" dangerouslySetInnerHTML={{ __html: shellHtml }} />;
  }

  return <InteractiveApp />;
}

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

if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('The application root was not found.');
  }

  mountApp(root);
}
