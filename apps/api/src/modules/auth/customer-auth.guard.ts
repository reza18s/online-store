import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  SessionService,
  type AuthenticatedCustomer,
} from './session.service';

export interface CustomerRequest extends RequestWithId {
  headers?: Record<string, string | string[] | undefined>;
  customer?: AuthenticatedCustomer;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function requestCookie(request: CustomerRequest, name: string): string | undefined {
  const header = headerValue(request.headers?.cookie);
  if (!header) return undefined;

  for (const segment of header.split(';')) {
    const separator = segment.indexOf('=');
    if (separator < 0 || segment.slice(0, separator).trim() !== name) continue;
    const value = segment.slice(separator + 1).trim();
    return value || undefined;
  }

  return undefined;
}

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  public constructor(private readonly sessions: SessionService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const session = await this.sessions.resolveCustomerSession(
      requestCookie(request, CUSTOMER_SESSION_COOKIE_NAME),
    );
    if (!session) throw new UnauthorizedException('برای ادامه وارد حساب شوید.');

    request.customer = session.user;
    return true;
  }
}
