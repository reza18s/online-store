import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException } from '@nestjs/common';
import { environment } from '@nova/config';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, CsrfGuard } from './csrf.guard';
import type { ResponseWithHeaders } from './request-id.middleware';

class FakeResponse implements ResponseWithHeaders {
  private readonly headers = new Map<string, string | string[]>();

  public setHeader(name: string, value: string | string[]): void {
    this.headers.set(name.toLowerCase(), value);
  }

  public getHeader(name: string): string | string[] | undefined {
    return this.headers.get(name.toLowerCase());
  }
}

function context(
  request: { method: string; headers?: Record<string, string> },
  response: FakeResponse,
) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as never;
}

function csrfCookie(response: FakeResponse): string {
  const value = response.getHeader('Set-Cookie');
  assert.ok(Array.isArray(value));
  const cookie = value.find((candidate) => candidate.startsWith(`${CSRF_COOKIE_NAME}=`));
  assert.ok(cookie);
  return cookie.slice(`${CSRF_COOKIE_NAME}=`.length).split(';', 1)[0] ?? '';
}

function assertForbidden(operation: () => unknown): void {
  assert.throws(operation, (error: unknown) => {
    return error instanceof ForbiddenException && error.getStatus() === 403;
  });
}

test('issues a readable CSRF cookie on safe requests', () => {
  const guard = new CsrfGuard();
  const response = new FakeResponse();

  assert.equal(guard.canActivate(context({ method: 'GET', headers: {} }, response)), true);
  const token = csrfCookie(response);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(String(response.getHeader('Set-Cookie')), /SameSite=Lax/);
  assert.doesNotMatch(String(response.getHeader('Set-Cookie')), /HttpOnly/);
});

test('accepts a state-changing request only with the configured origin and matching token', () => {
  const guard = new CsrfGuard();
  const response = new FakeResponse();
  const token = 'a'.repeat(43);
  const request = {
    method: 'POST',
    headers: {
      origin: environment.WEB_ORIGIN,
      cookie: `${CSRF_COOKIE_NAME}=${token}`,
      [CSRF_HEADER_NAME.toLowerCase()]: token,
    },
  };

  assert.equal(guard.canActivate(context(request, response)), true);
});

test('rejects missing or mismatched CSRF credentials before a mutation runs', () => {
  const guard = new CsrfGuard();
  const token = 'b'.repeat(43);

  assertForbidden(() =>
    guard.canActivate(
      context(
        {
          method: 'DELETE',
          headers: { origin: environment.WEB_ORIGIN },
        },
        new FakeResponse(),
      ),
    ),
  );
  assertForbidden(() =>
    guard.canActivate(
      context(
        {
          method: 'PATCH',
          headers: {
            origin: environment.WEB_ORIGIN,
            cookie: `${CSRF_COOKIE_NAME}=${token}`,
            [CSRF_HEADER_NAME.toLowerCase()]: 'c'.repeat(43),
          },
        },
        new FakeResponse(),
      ),
    ),
  );
  assertForbidden(() =>
    guard.canActivate(
      context(
        {
          method: 'POST',
          headers: {
            origin: 'https://attacker.example',
            cookie: `${CSRF_COOKIE_NAME}=${token}`,
            [CSRF_HEADER_NAME.toLowerCase()]: token,
          },
        },
        new FakeResponse(),
      ),
    ),
  );
});
