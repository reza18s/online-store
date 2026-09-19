import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, useEffect, useState } from 'react';

import { App } from '../app';
import { createQueryClient, seedInitialRenderData } from './query-client';

const queryClient = createQueryClient();
seedInitialRenderData(queryClient);

export function InteractiveApp() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
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
