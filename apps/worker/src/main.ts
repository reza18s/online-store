import { environment } from '@nova/config';
import { DatabaseClient } from '@nova/db';

import { createConsoleWorkerLogger } from './observability';
import { SmsIrNotificationSender } from './sms-ir-notification-sender';
import { NotificationWorkerRuntime } from './worker-runtime';

const database = new DatabaseClient();
const sender = new SmsIrNotificationSender({
  apiKey: environment.SMS_IR_API_KEY,
  templateId: environment.SMS_IR_TEMPLATE_ID,
  baseUrl: environment.SMS_IR_BASE_URL,
  sandbox: environment.SMS_IR_SANDBOX,
});
const runtime = new NotificationWorkerRuntime({
  database,
  sender,
  environment: environment.NODE_ENV,
  logger: createConsoleWorkerLogger(),
});

process.once('SIGINT', () => {
  void runtime.shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void runtime.shutdown('SIGTERM');
});

void runtime.start().catch(() => {
  process.exitCode = 1;
});
