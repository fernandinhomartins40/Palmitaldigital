import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { globalValidationPipe } from './common/pipes/validation.pipe';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  mkdirSync(join(process.cwd(), 'uploads', 'media'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(globalValidationPipe);

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
