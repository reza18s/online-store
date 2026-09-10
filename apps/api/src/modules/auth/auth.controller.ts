import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { ApiEnvelope, OtpRequestResponse, OtpVerifyResponse } from '@nova/api-client';
import { environment } from '@nova/config';

import {
  appendSetCookie,
  type RequestWithId,
  type ResponseWithHeaders,
} from '../../common/http/request-id.middleware';
import { AuthService } from './auth.service';
import { CUSTOMER_SESSION_COOKIE_NAME, type AuthenticatedCustomer } from './session.service';
import { OtpRequestDto, OtpVerifyDto } from './dto/auth.dto';

interface AuthRequest extends RequestWithId {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cookieValue(request: AuthRequest, name: string): string | undefined {
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

function setSessionCookie(response: ResponseWithHeaders, token: string, maxAge: number): void {
  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${CUSTOMER_SESSION_COOKIE_NAME}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearSessionCookie(response: ResponseWithHeaders): void {
  const secure = environment.WEB_ORIGIN.startsWith('https://') ? '; Secure' : '';
  appendSetCookie(
    response,
    `${CUSTOMER_SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

@Controller('auth')
export class AuthController {
  public constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  public async requestOtp(
    @Req() request: AuthRequest,
    @Body() body: OtpRequestDto,
  ): Promise<ApiEnvelope<OtpRequestResponse>> {
    const result = await this.auth.requestOtp({
      phone: body.phone,
      ip: request.ip ?? 'unknown',
    });
    return this.envelope(request, {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      resendAvailableAt: result.resendAvailableAt.toISOString(),
    });
  }

  @Post('otp/verify')
  public async verifyOtp(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: ResponseWithHeaders,
    @Body() body: OtpVerifyDto,
  ): Promise<ApiEnvelope<OtpVerifyResponse>> {
    const result = await this.auth.verifyOtp(body.challengeId, body.code);
    setSessionCookie(response, result.token, this.auth.sessionMaxAgeSeconds());
    return this.envelope(request, {
      user: result.user,
      expiresAt: result.expiresAt.toISOString(),
    });
  }

  @Get('me')
  public async current(
    @Req() request: AuthRequest,
  ): Promise<ApiEnvelope<AuthenticatedCustomer | null>> {
    return this.envelope(
      request,
      await this.auth.current(cookieValue(request, CUSTOMER_SESSION_COOKIE_NAME)),
    );
  }

  @Post('logout')
  public async logout(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: ResponseWithHeaders,
  ): Promise<ApiEnvelope<null>> {
    await this.auth.logout(cookieValue(request, CUSTOMER_SESSION_COOKIE_NAME));
    clearSessionCookie(response);
    return this.envelope(request, null);
  }

  private envelope<T>(request: AuthRequest, data: T): ApiEnvelope<T> {
    return {
      data,
      meta: {
        requestId: request.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
