import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedTestContainer } from 'testcontainers';

const POSTGRES_IMAGE = 'postgres:17-alpine';
const MONGO_IMAGE = 'mongo:7';

const projectRoot = resolve(__dirname, '../..');

// globalSetup and globalTeardown are separate modules, so module-level state would not be shared
// between them; globalThis is.
type Registry = { started?: StartedTestContainer[] };
const registry = globalThis as Registry;

function track(container: StartedTestContainer) {
  (registry.started ??= []).push(container);
}

// Starts a throwaway Postgres and brings its schema up to date by running the same migrations
// the real database runs, through the same TypeORM CLI entry point the `migration:run` script
// uses. A broken migration therefore fails the suite from the very first run.
export async function startPostgres(): Promise<string> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  track(container);
  const url = container.getConnectionUri();

  try {
    execFileSync(
      process.execPath,
      [
        './node_modules/typeorm/cli-ts-node-commonjs.js',
        'migration:run',
        '-d',
        'src/core/database/data-source.ts',
      ],
      {
        cwd: projectRoot,
        env: { ...process.env, DATABASE_URL: url },
        stdio: 'pipe',
      },
    );
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(
      `Migrations failed on the test database:\n${stdout?.toString()}\n${stderr?.toString()}`,
    );
  }
  return url;
}

export async function startMongo(): Promise<string> {
  const container = await new MongoDBContainer(MONGO_IMAGE).start();
  track(container);
  // The module starts a single-node replica set, whose member advertises the container's internal
  // hostname. Without directConnection the driver tries to resolve that name from the host and
  // fails (EAI_AGAIN); with it, it talks to the mapped port directly.
  return `${container.getConnectionString()}/?directConnection=true`;
}

export async function stopAll() {
  await Promise.all((registry.started ?? []).map((c) => c.stop()));
  registry.started = [];
}
