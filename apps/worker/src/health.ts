import { DatabaseClient } from '@nova/db';

import { createConsoleWorkerLogger } from './observability';

const database = new DatabaseClient();
const logger = createConsoleWorkerLogger();
let failed = false;

try {
  await database.$connect();
  await database.$queryRaw`SELECT 1`;
  logger.info({ event: 'worker_health', status: 'ok' });
} catch {
  failed = true;
  logger.error({
    event: 'worker_health_failed',
    errorCode: 'database-health-check-failed',
  });
} finally {
  try {
    await database.$disconnect();
  } catch {
    failed = true;
    logger.error({
      event: 'worker_shutdown_failed',
      errorCode: 'database-disconnect-failed',
    });
  }
}

process.exitCode = failed ? 1 : 0;
