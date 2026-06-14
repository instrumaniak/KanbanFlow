import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupFastifySession } from './test-utils';

type BoardResponse = {
  id: number;
  name: string;
  background_color: string;
  project_id: number | null;
  is_archived?: boolean;
  columns?: { id: number; name: string; position: number }[];
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

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

  describe('Authenticated Operations', () => {
    let agent: ReturnType<typeof request.agent>;
    let boardId: number;

    const testEmail = `boards-auth-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';

    beforeAll(async () => {
      agent = request.agent(url);
      await agent.post('/api/auth/register').send({ email: testEmail, password: testPassword });
      await agent.post('/api/auth/login').send({ email: testEmail, password: testPassword });
    });

    it('POST /api/boards - creates a board', async () => {
      const res = await agent
        .post('/api/boards')
        .send({ name: 'E2E Test Board' })
        .expect(201);

      const body = res.body as unknown as ApiResponse<BoardResponse>;
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe('E2E Test Board');
      expect(body.data.is_archived).toBe(false);
      expect(body.data.columns).toHaveLength(3);
      expect(body.data.columns![0].name).toBe('To Do');
      boardId = body.data.id;
    });

    it('GET /api/boards - lists boards including created one', async () => {
      const res = await agent.get('/api/boards').expect(200);
      const body = res.body as unknown as { data: BoardResponse[]; total: number };

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(1);
      const board = body.data.find((b) => b.id === boardId);
      expect(board).toBeDefined();
      expect(board!.name).toBe('E2E Test Board');
    });

    it('PATCH /api/boards/:id - updates board name', async () => {
      const res = await agent
        .patch(`/api/boards/${boardId}`)
        .send({ name: 'Updated Board Name' })
        .expect(200);

      const body = res.body as unknown as ApiResponse<BoardResponse>;
      expect(body.data.name).toBe('Updated Board Name');
    });

    it('GET /api/boards/:id - verifies the name update', async () => {
      const res = await agent.get(`/api/boards/${boardId}`).expect(200);
      const body = res.body as unknown as ApiResponse<BoardResponse>;

      expect(body.data.id).toBe(boardId);
      expect(body.data.name).toBe('Updated Board Name');
      expect(body.data.columns).toHaveLength(3);
    });

    it('PATCH /api/boards/:id/archive - archives the board', async () => {
      const res = await agent
        .patch(`/api/boards/${boardId}/archive`)
        .expect(200);

      const body = res.body as unknown as ApiResponse<BoardResponse>;
      expect(body.data.is_archived).toBe(true);
    });

    it('GET /api/boards/archived - lists archived boards', async () => {
      const res = await agent.get('/api/boards/archived').expect(200);
      const body = res.body as unknown as { data: BoardResponse[]; total: number };

      expect(Array.isArray(body.data)).toBe(true);
      const archived = body.data.find((b) => b.id === boardId);
      expect(archived).toBeDefined();
      expect(archived!.is_archived).toBe(true);
    });

    it('PATCH /api/boards/:id/restore - restores the board', async () => {
      const res = await agent
        .patch(`/api/boards/${boardId}/restore`)
        .expect(200);

      const body = res.body as unknown as ApiResponse<BoardResponse>;
      expect(body.data.is_archived).toBe(false);
    });

    it('DELETE /api/boards/:id - deletes the board', async () => {
      await agent.delete(`/api/boards/${boardId}`).expect(200);

      const res = await agent.get('/api/boards').expect(200);
      const body = res.body as unknown as { data: BoardResponse[]; total: number };
      const deleted = body.data.find((b) => b.id === boardId);
      expect(deleted).toBeUndefined();
    });

    it('permanent delete: archive + permanent delete a board', async () => {
      const createRes = await agent
        .post('/api/boards')
        .send({ name: 'Temp Board' })
        .expect(201);
      const tempBoardId = (createRes.body as unknown as ApiResponse<BoardResponse>).data.id;

      await agent.patch(`/api/boards/${tempBoardId}/archive`).expect(200);
      await agent.delete(`/api/boards/${tempBoardId}/permanent`).expect(200);

      const listRes = await agent.get('/api/boards/archived').expect(200);
      const listBody = listRes.body as unknown as { data: BoardResponse[]; total: number };
      const found = listBody.data.find((b) => b.id === tempBoardId);
      expect(found).toBeUndefined();
    });
  });
});
