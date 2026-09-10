export type WorkerSignal = 'SIGINT' | 'SIGTERM' | 'startup-failure';

export type WorkerInfoEvent =
  | {
      event: 'notification_batch';
      claimed: number;
      sent: number;
      retried: number;
      failed: number;
    }
  | { event: 'worker_started'; environment: string }
  | { event: 'worker_shutdown'; signal: WorkerSignal; disconnect: 'ok' | 'failed' }
  | { event: 'worker_health'; status: 'ok' };

export type WorkerErrorEvent =
  | { event: 'notification_tick_failed'; errorCode: 'notification-tick-failed' }
  | { event: 'worker_start_failed'; errorCode: 'worker-start-failed' }
  | { event: 'worker_shutdown_failed'; errorCode: 'database-disconnect-failed' }
  | { event: 'worker_health_failed'; errorCode: 'database-health-check-failed' };

export interface WorkerLogger {
  info(event: WorkerInfoEvent): void;
  error(event: WorkerErrorEvent): void;
}

function write(level: 'info' | 'error', event: WorkerInfoEvent | WorkerErrorEvent): void {
  const line = JSON.stringify({
    level,
    service: 'nova-worker',
    timestamp: new Date().toISOString(),
    ...event,
  });
  if (level === 'info') console.info(line);
  else console.error(line);
}

export function createConsoleWorkerLogger(): WorkerLogger {
  return {
    info: (event) => write('info', event),
    error: (event) => write('error', event),
  };
}
