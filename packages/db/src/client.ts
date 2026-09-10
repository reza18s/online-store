import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client';

const localDatabaseUrl = 'postgresql://nova:nova_local_only@localhost:5432/nova?schema=public';

export interface DatabaseClientOptions {
  connectionString?: string;
}

export class DatabaseClient extends PrismaClient {
  public constructor(options: DatabaseClientOptions = {}) {
    const adapter = new PrismaPg({
      connectionString: options.connectionString ?? process.env.DATABASE_URL ?? localDatabaseUrl,
    });

    super({ adapter });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export { Prisma, PrismaClient } from './generated/prisma/client';
