import { randomBytes, timingSafeEqual } from 'node:crypto';

import {
  ForbiddenException,
  Injectable,
  Optional,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { environment } from '@nova/config';

import {
  appendSetCookie,
  type RequestWithId,
  type ResponseWithHeaders,
} from './request-id.middleware';

export const CSRF_COOKIE_NAME = 'nova_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const SKIP_CSRF_KEY = 'csrf:skip';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
export const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_TOKEN_BYTES = 32;
const csrfOrigin = new URL(environment.WEB_ORIGIN).origin;

interface CsrfRequest extends RequestWithId {
  method?: string;
}

function headerValue(headers: CsrfRequest['headers'], name: string): string | undefined {
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name);
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
}

function cookieValue(request: CsrfRequest, name: string): string | undefined {
  const header = headerValue(request.headers, 'cookie');
  if (!header) return undefined;

  for (const segment of header.split(';')) {
    const separator = segment.indexOf('=');
    if (separator < 0 || segment.slice(0, separator).trim() !== name) continue;
    const value = segment.slice(separator + 1).trim();
    return value || undefined;
  }

  return undefined;
}

function createCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString('base64url');
}

function isTokenShape(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function tokensMatch(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!isTokenShape(cookieToken) || !isTokenShape(headerToken)) return false;
  const cookieBytes = Buffer.from(cookieToken, 'utf8');
  const headerBytes = Buffer.from(headerToken, 'utf8');
  return cookieBytes.length === headerBytes.length && timingSafeEqual(cookieBytes, headerBytes);
}

function hasAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    return new URL(origin).origin === csrfOrigin;
  } catch {
    return false;
  }
}

function issueCsrfCookie(response: ResponseWithHeaders): void {
  const secure = csrfOrigin.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${CSRF_COOKIE_NAME}=${createCsrfToken()}; Max-Age=${CSRF_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`,
  );
}

@Injectable()
export class CsrfGuard implements CanActivate {
  public constructor(@Optional() private readonly reflector?: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    if (
      this.reflector?.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<CsrfRequest>();
    const response = http.getResponse<ResponseWithHeaders>();
    const method = (request.method ?? 'GET').toUpperCase();
    const csrfCookie = cookieValue(request, CSRF_COOKIE_NAME);

    if (SAFE_METHODS.has(method)) {
      if (!isTokenShape(csrfCookie)) issueCsrfCookie(response);
      return true;
    }

    if (!hasAllowedOrigin(headerValue(request.headers, 'origin'))) {
      throw new ForbiddenException('منشأ درخواست معتبر نیست.');
    }
    if (!tokensMatch(csrfCookie, headerValue(request.headers, CSRF_HEADER_NAME))) {
      throw new ForbiddenException('توکن امنیتی درخواست معتبر نیست.');
    }

    return true;
  }
}
