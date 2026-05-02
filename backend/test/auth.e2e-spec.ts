import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Session } from './../src/sessions/entities/session.entity';

describe('Auth API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const testEmail = `api-e2e-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = app.get(DataSource);
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('POST /api/auth/register', () => {
    it('registers a new user with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(201);

      const body = res.body as {
        data: { email: string; id: number; role: string };
        message: string;
      };
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('email', testEmail);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('role');
      expect(body).toHaveProperty('message', 'Registration successful');
    });

    it('returns 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: testPassword })
        .expect(400);
    });

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: testPassword })
        .expect(400);
    });

    it('returns 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'weak@example.com', password: 'short' })
        .expect(400);
    });

    it('returns 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      const body = res.body as { data: { email: string }; message: string };
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('email', testEmail);
      expect(body).toHaveProperty('message', 'Login successful');
    });

    it('returns 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPass123!' })
        .expect(401);
    });

    it('returns 401 for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: testPassword })
        .expect(401);
    });

    it('returns 400 for missing fields', async () => {
      await request(app.getHttpServer()).post('/api/auth/login').send({}).expect(400);
    });
  });

  describe('Session persistence with TypeormStore', () => {
    const sessionEmail = `session-e2e-${Date.now()}@example.com`;
    const sessionPassword = 'Session123!';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: sessionEmail, password: sessionPassword });
    });

    it('login creates session row in DB', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: sessionEmail, password: sessionPassword })
        .expect(200);

      const sessionRepo = dataSource.getRepository(Session);
      const sessions = await sessionRepo.find();
      expect(sessions.length).toBeGreaterThanOrEqual(1);

      const sessionData = sessions.find((s) => s.json.includes(sessionEmail));
      expect(sessionData).toBeDefined();
      expect(sessionData!.id).toBeTruthy();
      expect(Number(sessionData!.expiredAt)).toBeGreaterThan(0);

      await agent.post('/api/auth/logout').expect(200);
    });

    it('/api/auth/me returns user from DB-backed session', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: sessionEmail, password: sessionPassword })
        .expect(200);

      const meRes = await agent.get('/api/auth/me').expect(200);
      const meBody = meRes.body as { data: { email: string } };
      expect(meBody.data.email).toBe(sessionEmail);

      await agent.post('/api/auth/logout').expect(200);
    });

    it('logout ends session and /me returns 401', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: sessionEmail, password: sessionPassword })
        .expect(200);

      const meRes = await agent.get('/api/auth/me').expect(200);
      const meBody = meRes.body as { data: { email: string } };
      expect(meBody.data.email).toBe(sessionEmail);

      await agent.post('/api/auth/logout').expect(200);
      await agent.get('/api/auth/me').expect(401);
    });

    it('concurrent login creates new session row (TypeormStore does NOT auto-replace)', async () => {
      const agent1 = request.agent(app.getHttpServer());
      const agent2 = request.agent(app.getHttpServer());

      await agent1
        .post('/api/auth/login')
        .send({ email: sessionEmail, password: sessionPassword })
        .expect(200);

      await agent2
        .post('/api/auth/login')
        .send({ email: sessionEmail, password: sessionPassword })
        .expect(200);

      const sessionRepo = dataSource.getRepository(Session);
      const sessions = await sessionRepo.find();
      const userSessions = sessions.filter((s) => s.json.includes(sessionEmail));

      expect(userSessions.length).toBeGreaterThanOrEqual(2);

      const ids = userSessions.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(userSessions.length);

      await agent1.post('/api/auth/logout').expect(200);
      await agent2.post('/api/auth/logout').expect(200);
    });

    it('session survives server restart (new app instance with same DB)', async () => {
      const agent = request.agent(app.getHttpServer());

      const loginRes = await agent
        .post('/api/auth/login')
        .send({ email: sessionEmail, password: sessionPassword })
        .expect(200);

      const setCookieHeader = (loginRes.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
      expect(setCookieHeader.length).toBeGreaterThan(0);
      const sessionCookie = setCookieHeader[0].split(';')[0];

      const sessionRepo = dataSource.getRepository(Session);
      const preRestartSession = await sessionRepo
        .createQueryBuilder('s')
        .where('s.json LIKE :email', { email: `%${sessionEmail}%` })
        .getOne();
      expect(preRestartSession).toBeDefined();
      const preRestartExpiredAt = Number(preRestartSession!.expiredAt);

      await agent.get('/api/auth/me').expect(200);

      const moduleFixture2: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      const app2 = moduleFixture2.createNestApplication();
      app2.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app2.init();

      try {
        const meRes2 = await request(app2.getHttpServer())
          .get('/api/auth/me')
          .set('Cookie', sessionCookie)
          .expect(200);

        const meBody2 = meRes2.body as { data: { email: string } };
        expect(meBody2.data.email).toBe(sessionEmail);

        const dataSource2 = app2.get(DataSource);
        const sessionRepo2 = dataSource2.getRepository(Session);
        const sessionInDb = await sessionRepo2
          .createQueryBuilder('s')
          .where('s.json LIKE :email', { email: `%${sessionEmail}%` })
          .getOne();
        expect(sessionInDb).toBeDefined();
        expect(Number(sessionInDb!.expiredAt)).toBeGreaterThanOrEqual(preRestartExpiredAt);
      } finally {
        await app2.close();
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });
});
