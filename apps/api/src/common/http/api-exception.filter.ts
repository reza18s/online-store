import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';

import type { RequestWithId, ResponseWithHeaders } from './request-id.middleware';

interface ResponseWithJson extends ResponseWithHeaders {
  status(code: number): {
    json(body: unknown): void;
  };
}

interface ExceptionBody {
  code?: unknown;
  details?: unknown;
  message?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getExceptionBody(exception: HttpException): ExceptionBody {
  const body = exception.getResponse();
  return isRecord(body) ? body : { message: body };
}

function getMessage(body: ExceptionBody, statusCode: number): string {
  if (Array.isArray(body.message)) {
    return body.message.map(String).join(', ');
  }

  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  return statusCode >= 500 ? 'خطای داخلی سرویس.' : 'درخواست قابل پردازش نیست.';
}

function getCode(body: ExceptionBody, statusCode: number): string {
  if (typeof body.code === 'string' && body.code.length > 0) {
    return body.code;
  }

  const codes: Partial<Record<number, string>> = {
    [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
    [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
    [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
    [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
    [HttpStatus.CONFLICT]: 'CONFLICT',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
    [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
    [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  };

  return codes[statusCode] ?? 'INTERNAL_ERROR';
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<ResponseWithJson>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? getExceptionBody(exception) : {};
    const requestId = request.requestId ?? 'unknown';

    response.status(statusCode).json({
      error: {
        code: getCode(body, statusCode),
        message: getMessage(body, statusCode),
        statusCode,
        requestId,
        timestamp: new Date().toISOString(),
        ...(body.details === undefined ? {} : { details: body.details }),
      },
    });
  }
}
