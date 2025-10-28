import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/academic_management/infrastructure/http/filters/global-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableShutdownHooks();
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
