import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Env } from '../config/env.validation';

// System of record for Event / TicketTier / Reservation. Correctness (never overselling a
// ticket tier) is guaranteed here via an atomic conditional update, not via the Redis cache —
// see core/cache/README.md.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL', { infer: true }),
        autoLoadEntities: true,
        // Migrations are now the source of truth for schema (see core/database/migrations/ and
        // the migration:* npm scripts) — synchronize must stay off so it doesn't fight them.
        synchronize: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
