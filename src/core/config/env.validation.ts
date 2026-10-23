import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

// Every URL-ish variable: the scheme is required, but a TLD is not (localhost, compose hostnames).
const url = (protocols: string[]) => ({
  protocols,
  require_protocol: true,
  require_tld: false,
});

// The environment contract of the API. Property names are the real variable names so that
// `ConfigService<Env, true>` gives autocomplete and types on `config.get('...')`.
export class Env {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number) // env vars are always strings; this makes PORT=3000 a number before @IsInt runs
  PORT = 3000;

  // Unset means CORS is disabled (see main.ts), so it is the one genuinely optional URL.
  @IsOptional()
  @IsUrl(url(['http', 'https']))
  WEB_ORIGIN?: string;

  @IsUrl(url(['postgres', 'postgresql']))
  DATABASE_URL!: string;

  @IsUrl(url(['mongodb', 'mongodb+srv']))
  MONGO_URL!: string;

  @IsUrl(url(['redis', 'rediss']))
  REDIS_URL!: string;
}

// Plugged into ConfigModule.forRoot({ validate }). Runs once at boot, before any module that
// reads config, and reports every problem at once instead of the first one.
export function validateEnv(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, { exposeDefaultValues: true });
  const errors = validateSync(env);
  if (errors.length > 0) {
    const lines = errors.map(
      (error) =>
        `  - ${error.property}: ${Object.values(error.constraints ?? {}).join('; ')}`,
    );
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return env;
}
