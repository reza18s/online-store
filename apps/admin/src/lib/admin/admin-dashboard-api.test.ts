import assert from 'node:assert/strict';
import { test } from 'node:test';

import { queryKeys } from '@nova/api-client';

import { adminDashboardSummaryPath } from './admin-dashboard-api';

test('builds the admin dashboard summary path with the supported period query', () => {
  assert.equal(
    adminDashboardSummaryPath({ periodDays: 90 }),
    '/v1/admin/dashboard/summary?periodDays=90',
  );
  assert.equal(adminDashboardSummaryPath(), '/v1/admin/dashboard/summary');
});

test('keeps dashboard summary periods isolated in the admin query key', () => {
  assert.deepEqual(queryKeys.adminDashboard.summary({ periodDays: 7 }), [
    'admin',
    'dashboard',
    'summary',
    { periodDays: 7 },
  ]);
  assert.notDeepEqual(
    queryKeys.adminDashboard.summary({ periodDays: 7 }),
    queryKeys.adminDashboard.summary({ periodDays: 30 }),
  );
});
