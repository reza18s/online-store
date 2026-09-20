import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StrictMode, useEffect, useState } from 'react';

import { App } from '@/app';
import { CleanNavigationBridge } from '@/app/routing/hash-route';
import { createQueryClient, seedInitialRenderData } from '@/app/providers/query-client';

const queryClient = createQueryClient();
seedInitialRenderData(queryClient);

export function InteractiveApp() {
  return (
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <CleanNavigationBridge />
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

export function StaticSsrHandoff({ shellHtml }: { shellHtml: string }) {
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    setInteractive(true);
  }, []);

  if (!interactive) {
    return <div data-nova-ssr-shell="true" dangerouslySetInnerHTML={{ __html: shellHtml }} />;
  }

  return <InteractiveApp />;
}
