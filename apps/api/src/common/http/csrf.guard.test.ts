import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { environment } from '@nova/config';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, CsrfGuard, SkipCsrf } from './csrf.guard';
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
  request: { method: string; headers?: Record<string, string | string[] | undefined> },
  response: FakeResponse,
  handler?: unknown,
  classRef?: unknown,
) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getHandler: () => handler,
    getClass: () => classRef,
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

test('normalizes safe methods and does not rotate an existing valid CSRF cookie', () => {
  const guard = new CsrfGuard();
  const response = new FakeResponse();
  const token = 'd'.repeat(43);

  assert.equal(
    guard.canActivate(
      context({ method: 'head', headers: { cookie: `${CSRF_COOKIE_NAME}=${token}` } }, response),
    ),
    true,
  );
  assert.equal(response.getHeader('Set-Cookie'), undefined);
});

test('ignores malformed cookie segments before a valid CSRF cookie', () => {
  const guard = new CsrfGuard();
  const response = new FakeResponse();
  const token = 'e'.repeat(43);

  assert.equal(
    guard.canActivate(
      context(
        {
          method: 'POST',
          headers: {
            origin: environment.WEB_ORIGIN,
            cookie: `malformed; ${CSRF_COOKIE_NAME}=${token}`,
            [CSRF_HEADER_NAME]: token,
          },
        },
        response,
      ),
    ),
    true,
  );
});

class SkippedController {
  @SkipCsrf()
  public handle(): undefined {
    return undefined;
  }
}

test('honors SkipCsrf metadata before requiring request credentials', () => {
  const guard = new CsrfGuard(new Reflector());
  const response = new FakeResponse();
  const controller = new SkippedController();

  assert.equal(
    guard.canActivate(
      context({ method: 'POST', headers: {} }, response, controller.handle, SkippedController),
    ),
    true,
  );
  assert.equal(response.getHeader('Set-Cookie'), undefined);
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

test('accepts the declared array-valued HTTP header shape for CSRF credentials', () => {
  const guard = new CsrfGuard();
  const response = new FakeResponse();
  const token = 'f'.repeat(43);

  assert.equal(
    guard.canActivate(
      context(
        {
          method: 'POST',
          headers: {
            origin: [environment.WEB_ORIGIN],
            cookie: [`${CSRF_COOKIE_NAME}=${token}`],
            [CSRF_HEADER_NAME]: [token],
          },
        },
        response,
      ),
    ),
    true,
  );
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
