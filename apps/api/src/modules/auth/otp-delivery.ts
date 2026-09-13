import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export const OTP_DELIVERY = Symbol('OTP_DELIVERY');

const SMS_IR_VERIFY_PATH = 'send/verify';
const SMS_IR_REQUEST_TIMEOUT_MS = 10_000;

export interface SmsIrConfig {
  apiKey?: string;
  templateId?: number;
  baseUrl?: string;
  sandbox?: boolean;
}

export interface SmsIrParameter {
  name: string;
  value: string;
}

export interface SmsIrHttpRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}

export interface SmsIrHttpResponse {
  status: number;
  json(): Promise<unknown>;
}

export type SmsIrHttpTransport = (request: SmsIrHttpRequest) => Promise<SmsIrHttpResponse>;

export interface SmsIrOtpDeliveryOptions extends SmsIrConfig {
  transport?: SmsIrHttpTransport;
}

function unconfiguredError(): ServiceUnavailableException {
  return new ServiceUnavailableException('سرویس ارسال پیامک پیکربندی نشده است.');
}

function deliveryError(): ServiceUnavailableException {
  return new ServiceUnavailableException('سرویس ارسال پیامک در دسترس نیست.');
}

function isValidBaseUrl(value: string | undefined): value is string {
  if (!value?.trim()) return false;
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

export function isValidSmsIrOtpDeliveryConfig(
  options: SmsIrConfig,
): options is Required<SmsIrConfig> {
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

function defaultTransport(): SmsIrHttpTransport {
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
    !Array.isArray(body) &&
    'status' in body &&
    (body as { status?: unknown }).status === 1,
  );
}

export interface OtpDelivery {
  send(phone: string, code: string): Promise<void>;
}

@Injectable()
export class SmsIrOtpDelivery implements OtpDelivery {
  private readonly transport: SmsIrHttpTransport;

  public constructor(private readonly options: SmsIrOtpDeliveryOptions) {
    this.transport = options.transport ?? defaultTransport();
  }

  public async send(phone: string, code: string): Promise<void> {
    if (!isValidSmsIrOtpDeliveryConfig(this.options)) throw unconfiguredError();
    if (!/^\+989\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) throw deliveryError();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SMS_IR_REQUEST_TIMEOUT_MS);
    try {
      const response = await this.transport({
        url: verifyUrl(this.options.baseUrl),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-KEY': this.options.apiKey.trim(),
        },
        body: JSON.stringify({
          mobile: phone,
          templateId: this.options.templateId,
          parameters: [{ name: 'Code', value: code } satisfies SmsIrParameter],
        }),
        signal: controller.signal,
      });

      if (!Number.isInteger(response.status) || response.status < 200 || response.status >= 300) {
        throw deliveryError();
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw deliveryError();
      }
      if (!isSuccessfulResponse(body)) throw deliveryError();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw deliveryError();
    } finally {
      clearTimeout(timeout);
    }
  }
}

@Injectable()
export class UnconfiguredOtpDelivery implements OtpDelivery {
  public async send(): Promise<void> {
    throw unconfiguredError();
  }
}
