import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RequestWithId } from '../../common/http/request-id.middleware';
import { requestCookie } from '../auth/customer-auth.guard';
import {
  STAFF_SESSION_COOKIE_NAME,
  SessionService,
  type AuthenticatedStaff,
} from '../auth/session.service';

export interface StaffRequest extends RequestWithId {
  headers?: Record<string, string | string[] | undefined>;
  staff?: AuthenticatedStaff;
}

export type StaffRole = 'support' | 'operations' | 'admin';

export const STAFF_ROLES_KEY = 'staff:roles';
export const RequireStaffRoles = (...roles: StaffRole[]) => SetMetadata(STAFF_ROLES_KEY, roles);

@Injectable()
export class StaffAuthGuard implements CanActivate {
  public constructor(private readonly sessions: SessionService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    const session = await this.sessions.resolveStaffSession(
      requestCookie(request, STAFF_SESSION_COOKIE_NAME),
    );
    if (!session) throw new UnauthorizedException('برای ادامه وارد پنل مدیریت شوید.');

    request.staff = session.user;
    return true;
  }
}

@Injectable()
export class StaffRoleGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<StaffRole[]>(STAFF_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const request = context.switchToHttp().getRequest<StaffRequest>();
    if (!request.staff) throw new UnauthorizedException('برای ادامه وارد پنل مدیریت شوید.');
    if (!roles.some((role) => request.staff?.roles.includes(role))) {
      throw new ForbiddenException('دسترسی لازم برای این عملیات را ندارید.');
    }
    return true;
  }
}

export function assertStaffRole(staff: AuthenticatedStaff, ...roles: StaffRole[]): void {
  if (!roles.some((role) => staff.roles.includes(role))) {
    throw new ForbiddenException('دسترسی لازم برای این عملیات را ندارید.');
  }
}
