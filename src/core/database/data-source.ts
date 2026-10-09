import { DataSource } from 'typeorm';

// Used by the TypeORM CLI only (migration:generate / migration:run), not by the running app —
// the app itself gets its connection through DatabaseModule's TypeOrmModule.forRootAsync, which
// uses autoLoadEntities instead of listing entities here. Env vars are loaded via Node's native
// --env-file flag in the npm scripts below, not a bundled dotenv dependency.
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
