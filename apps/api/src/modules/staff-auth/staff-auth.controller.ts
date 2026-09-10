import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { ApiEnvelope, StaffUser } from '@nova/api-client';
import { environment } from '@nova/config';

import {
  appendSetCookie,
  type RequestWithId,
  type ResponseWithHeaders,
} from '../../common/http/request-id.middleware';
import {
  STAFF_SESSION_COOKIE_NAME,
  type AuthenticatedStaff,
  STAFF_SESSION_ABSOLUTE_SECONDS,
} from '../auth/session.service';
import { requestCookie } from '../auth/customer-auth.guard';
import { StaffLoginDto } from './dto/staff-login.dto';
import { StaffAuthGuard, type StaffRequest } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';

function setStaffCookie(response: ResponseWithHeaders, token: string, maxAge: number): void {
  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${STAFF_SESSION_COOKIE_NAME}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearStaffCookie(response: ResponseWithHeaders): void {
  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${STAFF_SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

@Controller('staff/auth')
export class StaffAuthController {
  public constructor(private readonly auth: StaffAuthService) {}

  @Post('login')
  public async login(
    @Req() request: RequestWithId & { ip?: string },
    @Res({ passthrough: true }) response: ResponseWithHeaders,
    @Body() body: StaffLoginDto,
  ): Promise<ApiEnvelope<StaffUser>> {
    const result = await this.auth.login({
      email: body.email,
      password: body.password,
      factor: body.factor,
      ip: request.ip ?? 'unknown',
    });
    setStaffCookie(response, result.token, STAFF_SESSION_ABSOLUTE_SECONDS);
    return this.envelope(request, toStaffResponse(result.user));
  }

  @Get('me')
  @UseGuards(StaffAuthGuard)
  public async current(@Req() request: StaffRequest): Promise<ApiEnvelope<StaffUser>> {
    if (!request.staff) throw new Error('StaffAuthGuard did not attach a staff user.');
    return this.envelope(request, toStaffResponse(request.staff));
  }

  @Post('logout')
  public async logout(
    @Req() request: StaffRequest,
    @Res({ passthrough: true }) response: ResponseWithHeaders,
  ): Promise<ApiEnvelope<null>> {
    await this.auth.logout(requestCookie(request, STAFF_SESSION_COOKIE_NAME));
    clearStaffCookie(response);
    return this.envelope(request, null);
  }

  private envelope<T>(request: RequestWithId, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function toStaffResponse(source: AuthenticatedStaff): StaffUser {
  return {
    id: source.id,
    email: source.email,
    status: source.status,
    roles: source.roles,
  };
}
