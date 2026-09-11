import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, type ReactNode, useEffect, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import '@nova/ui/styles.css';

import { queryKeys } from '@nova/api-client';

import { App } from './app';
import {
  handleStaffSessionFailure,
  isStaffProtectedMutationKey,
  isStaffProtectedQueryKey,
} from './features/admin/admin-auth';
import { readInitialRenderContext, type InitialRenderContext } from './seo/metadata';
import './styles.css';

function redirectToStaffLogin(): void {
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#admin')) {
    window.location.hash = '#admin/login';
  }
}

export function createQueryClient(
  options: {
    isDevelopment?: boolean;
    onStaffSessionExpired?: () => void;
  } = {},
): QueryClient {
  const isDevelopment = options.isDevelopment ?? import.meta.env.DEV;
  const onStaffSessionExpired = options.onStaffSessionExpired ?? redirectToStaffLogin;

  const clearStaffSessionAfterFailure = (error: unknown): boolean => {
    const hasStaffSession = Boolean(queryClient.getQueryData(queryKeys.staffAuth.current()));
    return handleStaffSessionFailure(queryClient, error, {
      hasStaffSession,
      isDevelopment,
    });
  };

  const queryCache = new QueryCache({
    onError: (error, query) => {
      if (!isStaffProtectedQueryKey(query.queryKey)) return;
      if (clearStaffSessionAfterFailure(error)) onStaffSessionExpired();
    },
  });

  const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!isStaffProtectedMutationKey(mutation.options.mutationKey)) return;
      if (clearStaffSessionAfterFailure(error)) onStaffSessionExpired();
    },
  });

  const queryClient = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
  return queryClient;
}

export function seedInitialRenderData(
  queryClient: QueryClient,
  context: InitialRenderContext | undefined = readInitialRenderContext(),
): void {
  const data = context?.initialData;
  if (!data) return;

  switch (data.kind) {
    case 'home':
      queryClient.setQueryData(
        queryKeys.catalog.products({ limit: 8, sort: 'newest' }),
        data.products,
      );
      return;
    case 'category':
      queryClient.setQueryData(queryKeys.catalog.categories(), data.categories);
      queryClient.setQueryData(
        queryKeys.catalog.products({ audience: data.audience, limit: 4, sort: 'newest' }),
        data.products,
      );
      return;
    case 'product':
      queryClient.setQueryData(queryKeys.catalog.product(data.product.slug), data.product);
      return;
    case 'content':
      queryClient.setQueryData(queryKeys.content.page(data.page.slug), data.page);
      return;
  }
}

const queryClient = createQueryClient();
seedInitialRenderData(queryClient);

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
