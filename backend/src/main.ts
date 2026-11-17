import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
  });

  // /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER === '1') {
    const doc = new DocumentBuilder()
      .setTitle('10x MoM API')
      .setDescription('Laundry pickup & delivery for Lebanon. Admin routes use the httpOnly admin_session cookie from /auth/login.')
      .setVersion('1.0')
      .addCookieAuth('admin_session')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, process.env.HOST || '127.0.0.1');
  new Logger('Bootstrap').log(`API on http://127.0.0.1:${port}/api/v1 (docs: /api/docs)`);
}

bootstrap();
