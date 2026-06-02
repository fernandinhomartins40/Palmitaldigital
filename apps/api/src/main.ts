import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import { globalValidationPipe } from './common/pipes/validation.pipe';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  try {
    mkdirSync(join(process.cwd(), 'uploads', 'media'), { recursive: true });
    mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });
  } catch (err) {
    console.warn('Warning: could not create upload directories:', err);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalInterceptors(new SanitizeInterceptor());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}

bootstrap();
