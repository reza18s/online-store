import type { NotificationJobRecord, NotificationSender } from './notification-worker';

const SMS_IR_VERIFY_PATH = 'send/verify';
const SMS_IR_REQUEST_TIMEOUT_MS = 10_000;
const SUPPORTED_NOTIFICATION_KINDS = new Set(['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED']);

class SmsIrNotificationError extends Error {}

export interface SmsIrNotificationHttpRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}

export interface SmsIrNotificationHttpResponse {
  status: number;
  json(): Promise<unknown>;
}

export type SmsIrNotificationHttpTransport = (
  request: SmsIrNotificationHttpRequest,
) => Promise<SmsIrNotificationHttpResponse>;

export interface SmsIrNotificationSenderOptions {
  apiKey?: string;
  templateId?: number;
  baseUrl?: string;
  sandbox?: boolean;
  transport?: SmsIrNotificationHttpTransport;
}

function isValidBaseUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return (
      parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

export function isValidSmsIrNotificationConfig(
  options: Pick<SmsIrNotificationSenderOptions, 'apiKey' | 'templateId' | 'baseUrl' | 'sandbox'>,
): boolean {
  return Boolean(
    options.sandbox === true &&
    options.apiKey?.trim() &&
    Number.isSafeInteger(options.templateId) &&
    (options.templateId ?? 0) > 0 &&
    isValidBaseUrl(options.baseUrl),
  );
}

function verifyUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim();
  return new URL(
    SMS_IR_VERIFY_PATH,
    normalizedBaseUrl.endsWith('/') ? normalizedBaseUrl : `${normalizedBaseUrl}/`,
  ).toString();
}

function defaultTransport(): SmsIrNotificationHttpTransport {
  return async ({ url, headers, body, signal }) => {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal,
    });
    return {
      status: response.status,
      json: () => response.json() as Promise<unknown>,
    };
  };
}

function isSuccessfulResponse(body: unknown): boolean {
  return Boolean(
    body &&
    typeof body === 'object' &&
    'status' in body &&
    (body as { status?: unknown }).status === 1,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function notificationParameters(
  job: NotificationJobRecord,
): Array<{ name: string; value: string }> {
  if (!SUPPORTED_NOTIFICATION_KINDS.has(job.kind)) {
    throw new SmsIrNotificationError('sms-ir-unsupported-notification-kind');
  }
  if (!isRecord(job.payload) || 'code' in job.payload || 'otp' in job.payload) {
    throw new SmsIrNotificationError('sms-ir-invalid-notification-payload');
  }

  const orderNumber = job.payload.orderNumber;
  const amountToman = job.payload.amountToman;
  if (
    typeof orderNumber !== 'string' ||
    !orderNumber ||
    orderNumber.length > 128 ||
    (amountToman !== undefined &&
      (typeof amountToman !== 'number' ||
        !Number.isSafeInteger(amountToman) ||
        amountToman < 0 ||
        amountToman > 2_147_483_647))
  ) {
    throw new SmsIrNotificationError('sms-ir-invalid-notification-payload');
  }

  const parameters = [{ name: 'OrderNumber', value: orderNumber }];
  if (amountToman !== undefined) {
    parameters.push({ name: 'AmountToman', value: String(amountToman) });
  }
  return parameters;
}

export class SmsIrNotificationSender implements NotificationSender {
  private readonly options: SmsIrNotificationSenderOptions;
  private readonly transport: SmsIrNotificationHttpTransport;

  public constructor(options: SmsIrNotificationSenderOptions) {
    this.options = options;
    this.transport = options.transport ?? defaultTransport();
  }

  public async send(job: NotificationJobRecord): Promise<void> {
    if (!isValidSmsIrNotificationConfig(this.options)) {
      throw new SmsIrNotificationError('sms-ir-unconfigured');
    }
    if (!/^\+989\d{9}$/.test(job.recipient)) {
      throw new SmsIrNotificationError('sms-ir-invalid-recipient');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SMS_IR_REQUEST_TIMEOUT_MS);
    try {
      const response = await this.transport({
        url: verifyUrl(this.options.baseUrl!),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-KEY': this.options.apiKey!.trim(),
        },
        body: JSON.stringify({
          mobile: job.recipient,
          templateId: this.options.templateId,
          parameters: notificationParameters(job),
        }),
        signal: controller.signal,
      });

      if (!Number.isInteger(response.status) || response.status < 200 || response.status >= 300) {
        throw new SmsIrNotificationError('sms-ir-provider-error');
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new SmsIrNotificationError('sms-ir-malformed-response');
      }
      if (!isSuccessfulResponse(body)) throw new SmsIrNotificationError('sms-ir-provider-error');
    } catch (error) {
      if (error instanceof SmsIrNotificationError) throw error;
      throw new SmsIrNotificationError('sms-ir-request-failed');
    } finally {
      clearTimeout(timeout);
    }
  }
}
