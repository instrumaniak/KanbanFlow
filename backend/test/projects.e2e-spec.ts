import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupFastifySession } from './test-utils';

describe('Projects API (e2e)', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());
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
    it('GET /api/projects returns 401 without session', async () => {
      await request(url).get('/api/projects').expect(401);
    });

    it('POST /api/projects returns 401 without session', async () => {
      await request(url).post('/api/projects').send({ name: 'Test Project' }).expect(401);
    });

    it('PATCH /api/projects/:id returns 401 without session', async () => {
      await request(url).patch('/api/projects/1').send({ name: 'Updated' }).expect(401);
    });

    it('DELETE /api/projects/:id returns 401 without session', async () => {
      await request(url).delete('/api/projects/1').expect(401);
    });
  });

  describe('Route validation (without session)', () => {
    it('POST /api/projects returns 400 for invalid JSON body', async () => {
      await request(url)
        .post('/api/projects')
        .set('Content-Type', 'application/json')
        .send('invalid')
        .expect(400);
    });

    it('PATCH /api/projects/invalid returns 401 for non-numeric id', async () => {
      await request(url).patch('/api/projects/invalid').send({ name: 'Updated' }).expect(401);
    });

    it('DELETE /api/projects/invalid returns 401 for non-numeric id', async () => {
      await request(url).delete('/api/projects/invalid').expect(401);
    });
  });
});
