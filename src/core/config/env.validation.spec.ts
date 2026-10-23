import 'reflect-metadata';
import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5435/db',
  MONGO_URL: 'mongodb://user:pass@localhost:27017/db?authSource=admin',
  REDIS_URL: 'redis://localhost:6379',
};

describe('validateEnv', () => {
  it('accepts a complete environment and applies defaults', () => {
    const env = validateEnv(valid);
    expect(env.PORT).toBe(3000);
    expect(env.WEB_ORIGIN).toBeUndefined();
  });

  it('converts PORT from string to number', () => {
    expect(validateEnv({ ...valid, PORT: '4000' }).PORT).toBe(4000);
  });

  it('accepts WEB_ORIGIN when it is a URL', () => {
    const env = validateEnv({ ...valid, WEB_ORIGIN: 'http://localhost:3001' });
    expect(env.WEB_ORIGIN).toBe('http://localhost:3001');
  });

  it('reports every problem at once, not just the first', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(
      /PORT[\s\S]*DATABASE_URL[\s\S]*MONGO_URL[\s\S]*REDIS_URL/,
    );
  });

  it('rejects a URL with the wrong scheme', () => {
    expect(() =>
      validateEnv({ ...valid, REDIS_URL: 'http://localhost:6379' }),
    ).toThrow(/REDIS_URL/);
  });

  it('rejects an invalid WEB_ORIGIN instead of silently ignoring it', () => {
    expect(() => validateEnv({ ...valid, WEB_ORIGIN: 'not-a-url' })).toThrow(
      /WEB_ORIGIN/,
    );
  });
});
