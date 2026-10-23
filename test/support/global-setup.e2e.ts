import { startMongo, startPostgres } from './containers';

// e2e boots the whole AppModule, so every connection it opens needs a real target. All of them
// are throwaway containers: the dev databases from docker-compose are never touched.
export default async function globalSetup() {
  const [databaseUrl, mongoUrl] = await Promise.all([
    startPostgres(),
    startMongo(),
  ]);
  process.env.DATABASE_URL = databaseUrl;
  process.env.MONGO_URL = mongoUrl;
  // Nothing connects to Redis yet. When the cache lands (see learning-path Phase 7), start a
  // Redis container here instead of this placeholder.
  process.env.REDIS_URL = 'redis://localhost:6379';
}
