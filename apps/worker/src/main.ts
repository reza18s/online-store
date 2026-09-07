import { environment } from '@nova/config';

const idleTimer = setInterval(() => undefined, 60_000);

function shutdown(signal: string): void {
  clearInterval(idleTimer);
  console.info(`[nova-worker] received ${signal}; shutting down.`);
  process.exitCode = 0;
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

console.info(`[nova-worker] idle in ${environment.NODE_ENV} mode; no jobs are registered yet.`);
