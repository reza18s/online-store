import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { environment } from '@nova/config';

import type { OtpStateStore } from './otp-state.store';

interface BunRedisClient {
  connected: boolean;
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  send(command: string, args: string[]): Promise<unknown>;
  close(): void;
}

interface BunRuntime {
  RedisClient: new (url: string) => BunRedisClient;
}

function getBunRuntime(): BunRuntime {
  const runtime = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;
  if (!runtime) throw new Error('RedisOtpStateStore requires the Bun runtime.');
  return runtime;
}

@Injectable()
export class RedisOtpStateStore implements OtpStateStore, OnModuleDestroy {
  private readonly client: BunRedisClient = new (getBunRuntime().RedisClient)(
    environment.REDIS_URL,
  );

  private connection: Promise<void> | undefined;

  public async get(key: string): Promise<string | null> {
    await this.ensureConnection();
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.ensureConnection();
    const response = await this.client.send('SET', [key, value, 'EX', String(ttlSeconds)]);
    if (response !== 'OK') throw new Error('Redis SET command failed.');
  }

  public async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    await this.ensureConnection();
    const response = await this.client.send('SET', [key, value, 'EX', String(ttlSeconds), 'NX']);
    return response === 'OK';
  }

  public async delete(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }

  public async increment(key: string, ttlSeconds: number): Promise<number> {
    await this.ensureConnection();
    const value = await this.client.incr(key);
    if (value === 1) await this.client.expire(key, ttlSeconds);
    return value;
  }

  public onModuleDestroy(): void {
    if (this.client.connected) this.client.close();
  }

  private async ensureConnection(): Promise<void> {
    if (this.client.connected) return;
    this.connection ??= this.client.connect().finally(() => {
      this.connection = undefined;
    });
    await this.connection;
  }
}
