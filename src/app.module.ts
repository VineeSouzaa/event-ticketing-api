import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { LoggingModule } from './core/logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Registers the global guard: every route requires a session unless marked @Public().
    // Sessions live in the package's in-memory store for v1 (single instance, lost on
    // restart) — hence allowInMemoryStorage. A Redis-backed SessionStore is the upgrade path.
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const webOrigin = config.get<string>('WEB_ORIGIN');
        return {
          allowInMemoryStorage: true,
          // The frontend lives on another origin: without this the package refuses its
          // state-changing requests (sign-in, sign-out, ...) as cross-site.
          session: { trustedOrigins: webOrigin ? [webOrigin] : [] },
        };
      },
    }),
    DatabaseModule,
    LoggingModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
