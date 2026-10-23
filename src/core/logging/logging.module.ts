import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Env } from '../config/env.validation';

// Structured observability logs only — reservation attempts, cache hit/miss, hold-expiry events.
// Never catalog or transactional data; that stays in Postgres (see core/database). Correlation-ID
// middleware and the log-writer service land here too once implemented.
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGO_URL', { infer: true }),
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class LoggingModule {}
