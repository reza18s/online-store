import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, type ReactNode } from 'react';
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

export function mountApp(rootElement: HTMLElement, renderers: AppRenderers = appRenderers): void {
  const app = (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );

  if (rootElement.dataset.novaSsr === 'true') {
    renderers.hydrate(rootElement, app);
    return;
  }

  renderers.create(rootElement, app);
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('The application root was not found.');
  }

  mountApp(root);
}
