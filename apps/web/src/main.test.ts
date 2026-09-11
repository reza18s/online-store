import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ReactElement } from 'react';

import { mountApp } from './main';

test('hydrates SSR roots and creates a root for client-only markup', () => {
  const calls: string[] = [];
  let handoff: ReactElement<{ shellHtml: string }> | undefined;
  const renderers = {
    create: () => calls.push('create'),
    hydrate: (_root: HTMLElement, app: unknown) => {
      calls.push('hydrate');
      handoff = app as ReactElement<{ shellHtml: string }>;
    },
  };

  mountApp(
    {
      dataset: { novaSsr: 'true' },
      firstElementChild: {
        getAttribute: (name: string) => (name === 'data-nova-ssr-shell' ? 'true' : null),
        innerHTML: '<main data-nova-ssr-content="true"><h1>SSR</h1></main>',
      },
    } as unknown as HTMLElement,
    renderers,
  );
  mountApp({ dataset: {}, firstElementChild: null } as unknown as HTMLElement, renderers);

  assert.deepEqual(calls, ['hydrate', 'create']);
  assert.equal(handoff?.props.shellHtml, '<main data-nova-ssr-content="true"><h1>SSR</h1></main>');
});
