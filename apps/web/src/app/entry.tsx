import { mountApp } from '@/app/providers/mount-app';

import '@nova/ui/styles.css';

import '@/styles.css';

export { createQueryClient, seedInitialRenderData } from '@/app/providers/query-client';
export { mountApp } from '@/app/providers/mount-app';

if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('The application root was not found.');
  }

  mountApp(root);
}
