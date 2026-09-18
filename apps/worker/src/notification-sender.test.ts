import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createNotificationSender } from './notification-sender';
import { LocalNotificationSender } from './notification-worker';

const baseConfig = {
  SMS_IR_API_KEY: undefined,
  SMS_IR_TEMPLATE_ID: undefined,
  SMS_IR_BASE_URL: 'https://api.sms.ir/v1',
  SMS_IR_SANDBOX: true,
};

test('uses a no-network notification sender in development and test', async () => {
  const sender = createNotificationSender({ ...baseConfig, NODE_ENV: 'development' });

  assert.equal(sender instanceof LocalNotificationSender, true);
  await sender.send({
    id: 'job-1',
    kind: 'PAYMENT_SUCCEEDED',
    recipient: '+989123456789',
    payload: {},
    attempts: 1,
  });
});

test('keeps production unconfigured when SMS.ir credentials are absent', async () => {
  const sender = createNotificationSender({ ...baseConfig, NODE_ENV: 'production' });

  await assert.rejects(
    sender.send({
      id: 'job-2',
      kind: 'PAYMENT_SUCCEEDED',
      recipient: '+989123456789',
      payload: {},
      attempts: 1,
    }),
    /notification-provider-unconfigured/,
  );
});
