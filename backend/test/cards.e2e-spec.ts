import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { SuperAgentTest } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type CardResponse = {
  id: number;
  title: string;
  column_id: number;
  position: number;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

describe('Cards API (e2e)', () => {
  let app: INestApplication<App>;
  let agent: SuperAgentTest;
  let boardId: number;
  let projectId: number;
  let columnId: number;

  const testEmail = `cards-e2e-${Date.now()}@example.com`;
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

    // Create a column
    const colRes = await agent
      .post(`/api/boards/${boardId}/columns`)
      .send({ name: 'To Do' })
      .expect(201);
    columnId = (colRes.body as unknown as ApiResponse<{ id: number }>).data.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('CRUD Operations', () => {
    let cardId: number;

    it('POST /api/cards - creates a new card', async () => {
      const res = await agent
        .post('/api/cards')
        .send({ title: 'Task 1', column_id: columnId })
        .expect(201);

      const body = res.body as unknown as ApiResponse<CardResponse>;
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe('Task 1');
      expect(body.data.column_id).toBe(columnId);
      cardId = body.data.id;
    });

    it('GET /api/columns/:columnId/cards - retrieves cards for a column', async () => {
      const res = await agent.get(`/api/columns/${columnId}/cards`).expect(200);
      const body = res.body as unknown as ApiResponse<CardResponse[]>;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].title).toBe('Task 1');
    });

    it('PATCH /api/cards/:id - updates card title', async () => {
      const res = await agent
        .patch(`/api/cards/${cardId}`)
        .send({ title: 'Task 1 Updated' })
        .expect(200);
      const body = res.body as unknown as ApiResponse<CardResponse>;

      expect(body.data.title).toBe('Task 1 Updated');
    });

    it('PATCH /api/cards/:id - moves card to another column', async () => {
      // Create another column
      const colRes = await agent
        .post(`/api/boards/${boardId}/columns`)
        .send({ name: 'Done' })
        .expect(201);
      const targetColId = (colRes.body as unknown as ApiResponse<{ id: number }>).data.id;

      const res = await agent
        .patch(`/api/cards/${cardId}`)
        .send({ column_id: targetColId })
        .expect(200);
      const body = res.body as unknown as ApiResponse<CardResponse>;

      expect(body.data.column_id).toBe(targetColId);

      // Verify card actually persisted in target column via API
      const targetCardsRes = await agent.get(`/api/columns/${targetColId}/cards`).expect(200);
      const targetCardsBody = targetCardsRes.body as unknown as ApiResponse<CardResponse[]>;
      const movedCard = targetCardsBody.data.find((card) => card.id === cardId);
      expect(movedCard).toBeDefined();
      expect(movedCard?.column_id).toBe(targetColId);
    });

    it('DELETE /api/cards/:id - deletes a card', async () => {
      await agent.delete(`/api/cards/${cardId}`).expect(200);

      const res = await agent.get(`/api/columns/${columnId}/cards`).expect(200);
      const body = res.body as unknown as ApiResponse<CardResponse[]>;
      const card = body.data.find((item) => item.id === cardId);
      expect(card).toBeUndefined();
    });
  });
});
