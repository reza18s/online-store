import { environment } from '@nova/config';
import { DatabaseClient } from '@nova/db';

import { createConsoleWorkerLogger } from './observability';
import { createNotificationSender } from './notification-sender';
import { NotificationWorkerRuntime } from './worker-runtime';

const database = new DatabaseClient();
const sender = createNotificationSender(environment);
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
