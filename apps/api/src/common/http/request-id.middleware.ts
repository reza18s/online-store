import { randomUUID } from 'node:crypto';

export interface RequestWithId {
  headers?: Record<string, string | string[] | undefined>;
  requestId?: string;
}

export interface ResponseWithHeaders {
  setHeader(name: string, value: string | string[]): void;
  getHeader?(name: string): number | string | string[] | undefined;
}

export function appendSetCookie(response: ResponseWithHeaders, cookie: string): void {
  const current = response.getHeader?.('Set-Cookie');
  const cookies = Array.isArray(current)
    ? current.map(String)
    : typeof current === 'string'
      ? [current]
      : [];

  response.setHeader('Set-Cookie', [...cookies, cookie]);
}

const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function getRequestId(request: RequestWithId): string {
  const value = request.headers?.['x-request-id'];
  const candidate = Array.isArray(value) ? value[0] : value;

  return typeof candidate === 'string' && requestIdPattern.test(candidate)
    ? candidate
    : randomUUID();
}

export function requestIdMiddleware(
  request: RequestWithId,
  response: ResponseWithHeaders,
  next: () => void,
): void {
  const requestId = getRequestId(request);
  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
