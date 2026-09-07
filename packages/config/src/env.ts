import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://nova:nova_local_only@localhost:5432/nova?schema=public'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse({
    NODE_ENV: input.NODE_ENV,
    API_PORT: input.API_PORT,
    WEB_ORIGIN: input.WEB_ORIGIN,
    DATABASE_URL: input.DATABASE_URL,
    REDIS_URL: input.REDIS_URL,
  });
}

export const environment = parseEnvironment();
