import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Projects API (e2e)', () => {
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
    it('GET /api/projects returns 401 without session', async () => {
      await request(app.getHttpServer()).get('/api/projects').expect(401);
    });

    it('POST /api/projects returns 401 without session', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({ name: 'Test Project' })
        .expect(401);
    });

    it('PATCH /api/projects/:id returns 401 without session', async () => {
      await request(app.getHttpServer())
        .patch('/api/projects/1')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('DELETE /api/projects/:id returns 401 without session', async () => {
      await request(app.getHttpServer()).delete('/api/projects/1').expect(401);
    });
  });

  // Note: express-session cookie propagation may not work reliably in supertest.
  // CRUD operations and validation with session are tested in Playwright E2E.
  // These tests verify the API contract and guard behavior without session.

  describe('Route validation (without session)', () => {
    it('POST /api/projects returns 400 for invalid JSON body', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Content-Type', 'application/json')
        .send('invalid')
        .expect(400);
    });

    it('PATCH /api/projects/invalid returns 401 for non-numeric id', async () => {
      await request(app.getHttpServer())
        .patch('/api/projects/invalid')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('DELETE /api/projects/invalid returns 401 for non-numeric id', async () => {
      await request(app.getHttpServer()).delete('/api/projects/invalid').expect(401);
    });
  });
});
