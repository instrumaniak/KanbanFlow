import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppModule } from './app.module';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { Session } from './sessions/entities/session.entity';
import { TypeormStore } from 'connect-typeorm';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // --- Session store setup (must be before app.init() for routes to have session) ---
  const dataSource = app.get(DataSource);
  const sessionRepository = dataSource.getRepository(Session);

  const fastifyCookie = (await import('@fastify/cookie')).default;
  const fastifySession = (await import('@fastify/session')).default;

  await app.register(fastifyCookie as any);
  await app.register(fastifySession as any, {
    store: new TypeormStore({
      ttl: 86400,
      cleanupLimit: 10,
      limitSubquery: false,
      onError: (store, error: Error) => console.error('Session store error:', error),
    }).connect(sessionRepository),
    secret: getSessionSecret(),
    cookieName: 'connect.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 86400000,
    },
  });

  // --- Security headers ---
  const fastifyHelmet = (await import('@fastify/helmet')).default;
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  // --- Response compression ---
  const fastifyCompress = (await import('@fastify/compress')).default;
  await app.register(fastifyCompress as any, {
    global: true,
  });

  const config = new DocumentBuilder()
    .setTitle('KanbanFlow API')
    .setVersion('0.0.1')
    .addCookieAuth('connect.sid', {
      type: 'apiKey',
      description: 'Session cookie — login first via POST /api/auth/login',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // --- Static file serving + SPA fallback (release only) ---
  const publicPath = join(__dirname, 'public');
  const hasPublicFolder = require('fs').existsSync(publicPath);

  if (hasPublicFolder) {
    const fastifyStatic = (await import('@fastify/static')).default;
    await app.register(fastifyStatic as any, {
      root: publicPath,
      wildcard: false,
    });

    // SPA fallback: serve index.html for all non-API routes
    const fastify = app.getHttpAdapter().getInstance();
    fastify.setNotFoundHandler((req: FastifyRequest, res: FastifyReply) => {
      if (req.url?.startsWith('/api/')) {
        res.code(404).send({ message: 'Not Found' });
        return;
      }
      res.sendFile('index.html', publicPath);
    });
  } else {
    console.log('[INFO] No public/ folder found - SPA fallback disabled');
  }

  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return secret;
}

void bootstrap();
