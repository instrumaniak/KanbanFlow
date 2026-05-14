import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as fastifyCookie from '@fastify/cookie';
import * as fastifySession from '@fastify/session';
import * as fastifyHelmet from '@fastify/helmet';
import * as fastifyCompress from '@fastify/compress';
import { DataSource } from 'typeorm';
import { Session } from '../src/sessions/entities/session.entity';
import { TypeormStore } from 'connect-typeorm';

export async function setupFastifySession(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const sessionRepository = dataSource.getRepository(Session);

  await app.register(fastifyCookie as any);
  await app.register(fastifySession as any, {
    store: new TypeormStore({
      ttl: 86400,
      cleanupLimit: 10,
      limitSubquery: false,
      onError: (store, error: Error) => console.error('Session store error:', error),
    }).connect(sessionRepository),
    secret: process.env.SESSION_SECRET || 'kanbanflow-test-secret-key-32chars-min',
    cookieName: 'connect.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 86400000,
    },
  });

  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  await app.register(fastifyCompress as any, {
    global: true,
  });
}
