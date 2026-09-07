import type { ApiErrorEnvelope, ApiEnvelope } from './types';

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly payload: ApiErrorEnvelope | undefined;

  public constructor(status: number, payload?: ApiErrorEnvelope) {
    super(payload?.error.message ?? `API request failed with status ${status}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  public constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
    this.fetcher = options.fetcher ?? fetch;
  }

  public async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      credentials: init.credentials ?? 'include',
      headers,
    });

    const body = await this.readBody(response);
    if (!response.ok) {
      throw new ApiClientError(response.status, this.isApiError(body) ? body : undefined);
    }

    return body as T;
  }

  public get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  public getEnvelope<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.get<ApiEnvelope<T>>(path);
  }

  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text };
    }
  }

  private isApiError(value: unknown): value is ApiErrorEnvelope {
    if (!value || typeof value !== 'object' || !('error' in value)) {
      return false;
    }

    const error = value.error;
    return typeof error === 'object' && error !== null && 'message' in error;
  }
}

export const apiClient = new ApiClient();
