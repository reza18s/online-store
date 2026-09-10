import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { environment } from '@nova/config';
import { DatabaseClient } from '@nova/db';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client = new DatabaseClient({ connectionString: environment.DATABASE_URL });

  public get prisma(): DatabaseClient {
    return this.client;
  }

  public async checkConnection(): Promise<void> {
    await this.client.$queryRawUnsafe('SELECT 1');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
