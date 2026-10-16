import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Credentials: the session cookie must travel on cross-origin calls from the frontend.
  const webOrigin = app.get(ConfigService).get<string>('WEB_ORIGIN');
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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
