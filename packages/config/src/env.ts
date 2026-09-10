import { z } from 'zod';

export const DEFAULT_AUTH_SECRET = 'nova-local-only-auth-secret-change-me-2026';
export const DEFAULT_STAFF_TOTP_ENCRYPTION_KEY = 'nova-local-only-staff-totp-key-change-me-2026';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://nova:nova_local_only@localhost:5432/nova?schema=public'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  AUTH_SECRET: z.string().min(32).default(DEFAULT_AUTH_SECRET),
  STAFF_TOTP_ENCRYPTION_KEY: z.string().min(32).default(DEFAULT_STAFF_TOTP_ENCRYPTION_KEY),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse({
    NODE_ENV: input.NODE_ENV,
    API_PORT: input.API_PORT,
    WEB_ORIGIN: input.WEB_ORIGIN,
    DATABASE_URL: input.DATABASE_URL,
    REDIS_URL: input.REDIS_URL,
    AUTH_SECRET: input.AUTH_SECRET,
    STAFF_TOTP_ENCRYPTION_KEY: input.STAFF_TOTP_ENCRYPTION_KEY,
  });
}

export const environment = parseEnvironment();
