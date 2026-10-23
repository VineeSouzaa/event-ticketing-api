import { startPostgres } from './containers';

// Integration tests talk to a real Postgres and nothing else. Started once for the whole run;
// DATABASE_URL is set here, in the parent process, before the test workers are created.
export default async function globalSetup() {
  process.env.DATABASE_URL = await startPostgres();
}
