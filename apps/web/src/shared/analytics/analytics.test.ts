import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyticsContext } from '@/shared/analytics/analytics';

test('does not access browser storage during server rendering', () => {
  assert.deepEqual(analyticsContext(), {});
});
