import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mountApp } from './main';

test('hydrates SSR roots and creates a root for client-only markup', () => {
  const calls: string[] = [];
  const renderers = {
    create: () => calls.push('create'),
    hydrate: () => calls.push('hydrate'),
  };

  mountApp({ dataset: { novaSsr: 'true' } } as unknown as HTMLElement, renderers);
  mountApp({ dataset: {} } as unknown as HTMLElement, renderers);

  assert.deepEqual(calls, ['hydrate', 'create']);
});
