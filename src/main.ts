import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Env } from './core/config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // applies DTO defaults and @Transform (query-string numbers)
    }),
  );

  // Credentials: the session cookie must travel on cross-origin calls from the frontend.
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const webOrigin = config.get('WEB_ORIGIN', { infer: true });
  if (webOrigin) {
    app.enableCors({ origin: webOrigin, credentials: true });
  }

  // The generated spec is the contract the frontend builds its typed client from.
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Event Ticketing API')
      .addCookieAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.get('PORT', { infer: true }));
}
void bootstrap();
