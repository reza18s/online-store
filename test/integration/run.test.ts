import assert from 'node:assert/strict';
import { test } from 'node:test';

import { commerceIntegrationSuites } from './suites';
import { isFullMatrix } from './run';

test('distinguishes a full matrix from a selected diagnostic subset', () => {
  assert.equal(isFullMatrix(commerceIntegrationSuites), true);
  assert.equal(isFullMatrix(commerceIntegrationSuites.slice(0, 2)), false);
});
