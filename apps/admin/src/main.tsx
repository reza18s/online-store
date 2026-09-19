import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import '@nova/ui/styles.css';
import './styles.css';

import { AdminApp } from './components/admin/admin-app';
import { createQueryClient } from './providers/query-client';

const root = document.getElementById('root');

if (!root) throw new Error('The application root was not found.');

const page = decodeURIComponent(
  window.location.pathname.replace(/^\/admin\/?/, '').replace(/^\/+/, '') || 'admin',
);
const queryString = window.location.search.slice(1);

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <AdminApp page={page} queryString={queryString} />
    </QueryClientProvider>
  </StrictMode>,
);
