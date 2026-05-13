import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { SuperAgentTest } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type ColumnResponse = {
  id: number;
  name: string;
  position: number;
  board_id: number;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

describe('Columns API (e2e)', () => {
  let app: INestApplication<App>;
  let agent: SuperAgentTest;
  let boardId: number;
  let projectId: number;

  const testEmail = `columns-e2e-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    agent = request.agent(app.getHttpServer());

    // Register and Login
    await agent.post('/api/auth/register').send({ email: testEmail, password: testPassword });
    await agent.post('/api/auth/login').send({ email: testEmail, password: testPassword });

    // Create a project
    const projRes = await agent.post('/api/projects').send({ name: 'E2E Project' }).expect(201);
    projectId = (projRes.body as unknown as ApiResponse<{ id: number }>).data.id;

    // Create a board
    const boardRes = await agent
      .post('/api/boards')
      .send({ name: 'E2E Board', project_id: projectId })
      .expect(201);
    boardId = (boardRes.body as unknown as ApiResponse<{ id: number }>).data.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('CRUD Operations', () => {
    let columnId: number;

    it('POST /api/boards/:boardId/columns - creates a new column', async () => {
      const res = await agent
        .post(`/api/boards/${boardId}/columns`)
        .send({ name: 'To Do' })
        .expect(201);
      const body = res.body as unknown as ApiResponse<ColumnResponse>;

      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe('To Do');
      columnId = body.data.id;
    });

    it('GET /api/boards/:boardId/columns - retrieves all columns', async () => {
      const res = await agent.get(`/api/boards/${boardId}/columns`).expect(200);
      const body = res.body as unknown as ApiResponse<ColumnResponse[]>;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].name).toBe('To Do');
    });

    it('PATCH /api/columns/:id - updates a column', async () => {
      const res = await agent
        .patch(`/api/columns/${columnId}`)
        .send({ name: 'Backlog' })
        .expect(200);
      const body = res.body as unknown as ApiResponse<ColumnResponse>;

      expect(body.data.name).toBe('Backlog');
    });

    it('DELETE /api/columns/:id - deletes a column', async () => {
      await agent.delete(`/api/columns/${columnId}`).expect(200);

      const res = await agent.get(`/api/boards/${boardId}/columns`).expect(200);
      const body = res.body as unknown as ApiResponse<ColumnResponse[]>;
      const column = body.data.find((item) => item.id === columnId);
      expect(column).toBeUndefined();
    });
  });

  describe('Special Operations', () => {
    let sourceColId: number;
    let targetColId: number;

    beforeEach(async () => {
      const res1 = await agent
        .post(`/api/boards/${boardId}/columns`)
        .send({ name: 'Source' })
        .expect(201);
      sourceColId = (res1.body as unknown as ApiResponse<ColumnResponse>).data.id;

      const res2 = await agent
        .post(`/api/boards/${boardId}/columns`)
        .send({ name: 'Target' })
        .expect(201);
      targetColId = (res2.body as unknown as ApiResponse<ColumnResponse>).data.id;

      // Add a card to source column
      await agent
        .post('/api/cards')
        .send({ title: 'Test Card', column_id: sourceColId })
        .expect(201);
    });

    it('PATCH /api/columns/:id/sort - sorts cards', async () => {
      await agent.patch(`/api/columns/${sourceColId}/sort`).send({ order: 'desc' }).expect(200);
    });

    it('POST /api/columns/:id/move-all - moves all cards', async () => {
      const res = await agent
        .post(`/api/columns/${sourceColId}/move-all`)
        .send({ targetColumnId: targetColId })
        .expect(201);
      const body = res.body as unknown as ApiResponse<{ movedCount: number }>;

      expect(body.data.movedCount).toBe(1);
    });
  });
});
