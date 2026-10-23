import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { validateEnv, Env } from './core/config/env.validation';
import { DatabaseModule } from './core/database/database.module';
import { LoggingModule } from './core/logging/logging.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // Fails the boot, listing every invalid variable, instead of failing later where it is used.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Registers the global guard: every route requires a session unless marked @Public().
    // Sessions live in the package's in-memory store for v1 (single instance, lost on
    // restart) — hence allowInMemoryStorage. A Redis-backed SessionStore is the upgrade path.
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const webOrigin = config.get('WEB_ORIGIN', { infer: true });
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
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
