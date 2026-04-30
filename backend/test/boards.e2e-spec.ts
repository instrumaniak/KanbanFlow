import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Boards API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('Protected routes (no session)', () => {
    it('GET /api/boards returns 401 without session', async () => {
      await request(app.getHttpServer()).get('/api/boards').expect(401);
    });

    it('POST /api/boards returns 401 without session', async () => {
      await request(app.getHttpServer())
        .post('/api/boards')
        .send({ name: 'Test Board' })
        .expect(401);
    });

    it('GET /api/boards/:id returns 401 without session', async () => {
      await request(app.getHttpServer()).get('/api/boards/1').expect(401);
    });

    it('PATCH /api/boards/:id returns 401 without session', async () => {
      await request(app.getHttpServer())
        .patch('/api/boards/1')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('DELETE /api/boards/:id returns 401 without session', async () => {
      await request(app.getHttpServer()).delete('/api/boards/1').expect(401);
    });
  });

  describe('Route validation (without session)', () => {
    it('POST /api/boards returns 400 for empty body', async () => {
      await request(app.getHttpServer()).post('/api/boards').send({}).expect(401);
    });

    it('GET /api/boards/invalid returns 401 for non-numeric id', async () => {
      await request(app.getHttpServer()).get('/api/boards/invalid').expect(401);
    });

    it('PATCH /api/boards/invalid returns 401 for non-numeric id', async () => {
      await request(app.getHttpServer())
        .patch('/api/boards/invalid')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('DELETE /api/boards/invalid returns 401 for non-numeric id', async () => {
      await request(app.getHttpServer()).delete('/api/boards/invalid').expect(401);
    });
  });
});
