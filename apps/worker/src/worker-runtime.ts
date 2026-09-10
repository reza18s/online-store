import type { DatabaseClient } from '@nova/db';

import { createConsoleWorkerLogger, type WorkerLogger, type WorkerSignal } from './observability';
import { processNotificationBatch, type NotificationSender } from './notification-worker';

type WorkerTimer = ReturnType<typeof setInterval>;
type SetInterval = (callback: () => void, delayMs: number) => WorkerTimer;
type ClearInterval = (timer: WorkerTimer) => void;

export interface NotificationWorkerRuntimeOptions {
  database: DatabaseClient;
  sender: NotificationSender;
  environment: string;
  logger?: WorkerLogger;
  intervalMs?: number;
  setIntervalFn?: SetInterval;
  clearIntervalFn?: ClearInterval;
}

export class NotificationWorkerRuntime {
  private readonly database: DatabaseClient;
  private readonly sender: NotificationSender;
  private readonly environment: string;
  private readonly logger: WorkerLogger;
  private readonly intervalMs: number;
  private readonly setIntervalFn: SetInterval;
  private readonly clearIntervalFn: ClearInterval;
  private timer: WorkerTimer | undefined;
  private activeTick: Promise<void> | undefined;
  private connectionPromise: Promise<void> | undefined;
  private startPromise: Promise<void> | undefined;
  private shutdownPromise: Promise<void> | undefined;
  private shuttingDown = false;

  public constructor(options: NotificationWorkerRuntimeOptions) {
    this.database = options.database;
    this.sender = options.sender;
    this.environment = options.environment;
    this.logger = options.logger ?? createConsoleWorkerLogger();
    this.intervalMs = options.intervalMs ?? 5_000;
    this.setIntervalFn = options.setIntervalFn ?? setInterval;
    this.clearIntervalFn = options.clearIntervalFn ?? clearInterval;
  }

  public start(): Promise<void> {
    if (!this.startPromise) this.startPromise = this.startInternal();
    return this.startPromise;
  }

  public tick(): Promise<void> {
    if (this.shuttingDown || this.activeTick) return Promise.resolve();

    const tickPromise = this.processTick();
    this.activeTick = tickPromise;
    return tickPromise.finally(() => {
      if (this.activeTick === tickPromise) this.activeTick = undefined;
    });
  }

  public shutdown(signal: WorkerSignal): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;

    this.shuttingDown = true;
    if (this.timer) {
      this.clearIntervalFn(this.timer);
      this.timer = undefined;
    }

    this.shutdownPromise = this.finishShutdown(signal);
    return this.shutdownPromise;
  }

  private async startInternal(): Promise<void> {
    if (this.shuttingDown) return;

    try {
      this.connectionPromise = this.database.$connect();
      await this.connectionPromise;
      if (this.shuttingDown) return;

      await this.tick();
      if (this.shuttingDown) return;

      this.timer = this.setIntervalFn(() => {
        void this.tick();
      }, this.intervalMs);
      this.logger.info({ event: 'worker_started', environment: this.environment });
    } catch {
      this.logger.error({ event: 'worker_start_failed', errorCode: 'worker-start-failed' });
      await this.shutdown('startup-failure');
      throw new Error('worker-start-failed');
    }
  }

  private async processTick(): Promise<void> {
    try {
      const result = await processNotificationBatch(this.database, this.sender);
      this.logger.info({ event: 'notification_batch', ...result });
    } catch {
      this.logger.error({
        event: 'notification_tick_failed',
        errorCode: 'notification-tick-failed',
      });
    }
  }

  private async finishShutdown(signal: WorkerSignal): Promise<void> {
    if (this.activeTick) await this.activeTick;
    if (this.connectionPromise) {
      try {
        await this.connectionPromise;
      } catch {
        // Startup failure is reported by startInternal; shutdown still attempts cleanup.
      }
    }

    let disconnect: 'ok' | 'failed' = 'ok';
    try {
      await this.database.$disconnect();
    } catch {
      disconnect = 'failed';
      this.logger.error({
        event: 'worker_shutdown_failed',
        errorCode: 'database-disconnect-failed',
      });
    }
    this.logger.info({ event: 'worker_shutdown', signal, disconnect });
  }
}
