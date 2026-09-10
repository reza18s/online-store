import 'reflect-metadata';

import { Logger, ValidationPipe, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { environment } from '@nova/config';

import { ApiExceptionFilter } from './common/http/api-exception.filter';
import { CsrfGuard } from './common/http/csrf.guard';
import { requestIdMiddleware } from './common/http/request-id.middleware';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.use(requestIdMiddleware);
  app.enableCors({
    origin: environment.WEB_ORIGIN,
    credentials: true,
  });
  app.setGlobalPrefix('v1', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalGuards(app.get(CsrfGuard));

  await app.listen(environment.API_PORT, '0.0.0.0');
  logger.log(`API listening on port ${environment.API_PORT}`);
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
