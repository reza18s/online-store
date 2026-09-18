import { z } from 'zod';

export const DEFAULT_AUTH_SECRET = 'nova-local-only-auth-secret-change-me-2026';
export const DEFAULT_STAFF_TOTP_ENCRYPTION_KEY = 'nova-local-only-staff-totp-key-change-me-2026';

const booleanFromEnvironment = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return value;
  }, z.boolean().default(defaultValue));

const optionalTextFromEnvironment = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrlFromEnvironment = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

const optionalPositiveIntegerFromEnvironment = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    WEB_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgresql://nova:nova_local_only@localhost:5432/nova?schema=public'),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    S3_ENDPOINT: z.string().url().default('http://127.0.0.1:59000'),
    S3_REGION: z.string().min(1).default('us-east-1'),
    S3_BUCKET: z.string().min(1).default('nova-media-local'),
    S3_ACCESS_KEY: z.string().min(1).default('nova_local_s3'),
    S3_SECRET_KEY: z.string().min(1).default('nova_local_s3_secret_change_me'),
    S3_FORCE_PATH_STYLE: booleanFromEnvironment(true),
    ZARINPAL_MERCHANT_ID: optionalTextFromEnvironment,
    ZARINPAL_BASE_URL: optionalUrlFromEnvironment,
    ZARINPAL_SANDBOX: booleanFromEnvironment(true),
    SMS_IR_API_KEY: optionalTextFromEnvironment,
    SMS_IR_LINE_NUMBER: optionalTextFromEnvironment,
    SMS_IR_TEMPLATE_ID: optionalPositiveIntegerFromEnvironment,
    SMS_IR_BASE_URL: z.string().url().default('https://api.sms.ir/v1'),
    SMS_IR_SANDBOX: booleanFromEnvironment(true),
    IRAN_POST_API_KEY: optionalTextFromEnvironment,
    IRAN_POST_BASE_URL: optionalUrlFromEnvironment,
    IRAN_POST_SANDBOX: booleanFromEnvironment(true),
    AUTH_SECRET: z.string().min(32).default(DEFAULT_AUTH_SECRET),
    STAFF_TOTP_ENCRYPTION_KEY: z.string().min(32).default(DEFAULT_STAFF_TOTP_ENCRYPTION_KEY),
    LOCAL_TEST_MODE: booleanFromEnvironment(false),
  })
  .superRefine((value, context) => {
    if (value.LOCAL_TEST_MODE && value.NODE_ENV !== 'development' && value.NODE_ENV !== 'test') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['LOCAL_TEST_MODE'],
        message: 'LOCAL_TEST_MODE is allowed only in development or test environments.',
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse({
    NODE_ENV: input.NODE_ENV,
    API_PORT: input.API_PORT,
    WEB_ORIGIN: input.WEB_ORIGIN,
    DATABASE_URL: input.DATABASE_URL,
    REDIS_URL: input.REDIS_URL,
    S3_ENDPOINT: input.S3_ENDPOINT,
    S3_REGION: input.S3_REGION,
    S3_BUCKET: input.S3_BUCKET,
    S3_ACCESS_KEY: input.S3_ACCESS_KEY,
    S3_SECRET_KEY: input.S3_SECRET_KEY,
    S3_FORCE_PATH_STYLE: input.S3_FORCE_PATH_STYLE,
    ZARINPAL_MERCHANT_ID: input.ZARINPAL_MERCHANT_ID,
    ZARINPAL_BASE_URL: input.ZARINPAL_BASE_URL,
    ZARINPAL_SANDBOX: input.ZARINPAL_SANDBOX,
    SMS_IR_API_KEY: input.SMS_IR_API_KEY,
    SMS_IR_LINE_NUMBER: input.SMS_IR_LINE_NUMBER,
    SMS_IR_TEMPLATE_ID: input.SMS_IR_TEMPLATE_ID,
    SMS_IR_BASE_URL: input.SMS_IR_BASE_URL,
    SMS_IR_SANDBOX: input.SMS_IR_SANDBOX,
    IRAN_POST_API_KEY: input.IRAN_POST_API_KEY,
    IRAN_POST_BASE_URL: input.IRAN_POST_BASE_URL,
    IRAN_POST_SANDBOX: input.IRAN_POST_SANDBOX,
    AUTH_SECRET: input.AUTH_SECRET,
    STAFF_TOTP_ENCRYPTION_KEY: input.STAFF_TOTP_ENCRYPTION_KEY,
    LOCAL_TEST_MODE: input.LOCAL_TEST_MODE,
  });
}

export const environment = parseEnvironment();
