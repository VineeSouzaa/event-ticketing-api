import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

// Runs against the local Postgres from docker-compose (DATABASE_URL, migrations applied).
// Each run uses a unique email, so no cleanup is needed.
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'senha-bem-longa-1';
  // The package refuses state-changing requests whose Origin differs from the app's own host,
  // so the app listens on a real (ephemeral) port and requests send that same origin.
  let origin: string;

  const http = () => request(origin);
  const post = (path: string) => http().post(path).set('Origin', origin);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0, '127.0.0.1');
    origin = (await app.getUrl()).replace('[::1]', '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects /auth/me without a session', () => {
    return http().get('/auth/me').expect(401);
  });

  it('keeps the root route public', () => {
    return http().get('/').expect(200);
  });

  it('rejects an invalid sign-up body', () => {
    return post('/auth/sign-up')
      .send({ email: 'not-an-email', password: '1', name: 'x' })
      .expect(400);
  });

  it('signs up, sets a session cookie and never returns the hash', async () => {
    const res = await post('/auth/sign-up')
      .send({ email, password, name: 'E2E' })
      .expect(201);

    expect(res.body).toMatchObject({ email, name: 'E2E' });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a duplicate email, whatever its casing', () => {
    return post('/auth/sign-up')
      .send({ email: email.toUpperCase(), password, name: 'E2E' })
      .expect(409);
  });

  it('rejects a wrong password and an unknown email alike', async () => {
    const wrong = await post('/auth/sign-in')
      .send({ email, password: 'errada-errada-1' })
      .expect(401);
    const unknown = await post('/auth/sign-in')
      .send({ email: 'nobody@example.com', password })
      .expect(401);

    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('signs in, serves /auth/me with the cookie, and ends the session on sign-out', async () => {
    // The cookie is Secure (__Host-sid), so a cookie jar would not resend it over plain HTTP.
    const signIn = await post('/auth/sign-in')
      .send({ email, password })
      .expect(200);
    const cookie = (
      signIn.headers['set-cookie'] as unknown as string[]
    )[0].split(';')[0];

    const me = await http().get('/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body).toMatchObject({ email });
    expect(me.body).not.toHaveProperty('passwordHash');

    await post('/auth/sign-out').set('Cookie', cookie).expect(204);
    await http().get('/auth/me').set('Cookie', cookie).expect(401);
  });

  it('throttles repeated sign-in attempts', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await post('/auth/sign-in').send({
        email,
        password: 'errada-errada-1',
      });
      statuses.push(res.status);
    }

    expect(statuses).toContain(429);
  });
});
