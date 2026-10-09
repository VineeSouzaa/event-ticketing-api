import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// System of record for Event / TicketTier / Reservation. Correctness (never overselling a
// ticket tier) is guaranteed here via an atomic conditional update, not via the Redis cache —
// see core/cache/README.md.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Fine for early local development; switch to TypeORM migrations before this app
        // resembles anything production-like.
        synchronize: true,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
