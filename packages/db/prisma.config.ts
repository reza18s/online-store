import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const localDatabaseUrl = 'postgresql://nova:nova_local_only@localhost:5432/nova?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
});
