import { PrismaClient } from '@prisma/client';

export class DatabaseClient extends PrismaClient {
  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export { PrismaClient } from '@prisma/client';
