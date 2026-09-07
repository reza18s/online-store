import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { DatabaseClient } from '@nova/db';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client = new DatabaseClient();

  public async checkConnection(): Promise<void> {
    await this.client.$queryRawUnsafe('SELECT 1');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
