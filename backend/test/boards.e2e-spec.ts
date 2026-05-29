import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupFastifySession } from './test-utils';

describe('Boards API (e2e)', () => {
  let app: NestFastifyApplication;
  let url: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await setupFastifySession(app);
    await app.init();
    await app.listen(0);
    url = await app.getUrl();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('Protected routes (no session)', () => {
    it('GET /api/boards returns 401 without session', async () => {
      await request(url).get('/api/boards').expect(401);
    });

    it('POST /api/boards returns 401 without session', async () => {
      await request(url).post('/api/boards').send({ name: 'Test Board' }).expect(401);
    });

    it('GET /api/boards/:id returns 401 without session', async () => {
      await request(url).get('/api/boards/1').expect(401);
    });

    it('PATCH /api/boards/:id returns 401 without session', async () => {
      await request(url).patch('/api/boards/1').send({ name: 'Updated' }).expect(401);
    });

    it('DELETE /api/boards/:id returns 401 without session', async () => {
      await request(url).delete('/api/boards/1').expect(401);
    });
  });

  describe('Route validation (without session)', () => {
    it('POST /api/boards returns 400 for empty body', async () => {
      await request(url).post('/api/boards').send({}).expect(401);
    });

    it('GET /api/boards/invalid returns 401 for non-numeric id', async () => {
      await request(url).get('/api/boards/invalid').expect(401);
    });

    it('PATCH /api/boards/invalid returns 401 for non-numeric id', async () => {
      await request(url).patch('/api/boards/invalid').send({ name: 'Updated' }).expect(401);
    });

    it('DELETE /api/boards/invalid returns 401 for non-numeric id', async () => {
      await request(url).delete('/api/boards/invalid').expect(401);
    });
  });
});
