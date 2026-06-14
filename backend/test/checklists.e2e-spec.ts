import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { setupFastifySession } from './test-utils';

type ChecklistResponse = {
  id: number;
  title: string;
  card_id: number;
  items: {
    id: number;
    text: string;
    is_completed: boolean;
    checklist_id: number;
    position: number;
  }[];
  created_at: string;
  updated_at: string;
};

type ChecklistItemResponse = {
  id: number;
  text: string;
  is_completed: boolean;
  checklist_id: number;
  position: number;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

describe('Checklists API (e2e)', () => {
  let app: NestFastifyApplication;
  let url: string;
  let agent: ReturnType<typeof request.agent>;
  let dataSource: DataSource;
  let boardId: number;
  let projectId: number;
  let columnId: number;
  let cardId: number;

  const testEmail = `checklists-e2e-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

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
    dataSource = app.get(DataSource);

    agent = request.agent(url);

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

    // Create a card
    const cardRes = await agent
      .post('/api/cards')
      .send({ title: 'Test Card', column_id: columnId })
      .expect(201);
    cardId = (cardRes.body as unknown as ApiResponse<{ id: number }>).data.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('CRUD Operations', () => {
    let checklistId: number;
    let itemId: number;

    it('POST /api/cards/:cardId/checklists - creates a new checklist', async () => {
      const res = await agent
        .post(`/api/cards/${cardId}/checklists`)
        .send({ title: 'My Checklist' })
        .expect(201);

      const body = res.body as unknown as ApiResponse<ChecklistResponse>;
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe('My Checklist');
      expect(body.data.card_id).toBe(cardId);
      expect(body.data.items).toEqual([]);
      checklistId = body.data.id;

      const rows = await dataSource.query(
        'SELECT id, title, card_id FROM checklists WHERE id = ?',
        [checklistId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe('My Checklist');
      expect(rows[0].card_id).toBe(cardId);
    });

    it('GET /api/checklists/:id - retrieves a checklist', async () => {
      const res = await agent.get(`/api/checklists/${checklistId}`).expect(200);
      const body = res.body as unknown as ApiResponse<ChecklistResponse>;

      expect(body.data.id).toBe(checklistId);
      expect(body.data.title).toBe('My Checklist');
      expect(body.data.items).toEqual([]);
    });

    it('PATCH /api/checklists/:id - updates checklist title', async () => {
      const res = await agent
        .patch(`/api/checklists/${checklistId}`)
        .send({ title: 'Updated Checklist' })
        .expect(200);

      const body = res.body as unknown as ApiResponse<ChecklistResponse>;
      expect(body.data.title).toBe('Updated Checklist');

      const rows = await dataSource.query(
        'SELECT id, title FROM checklists WHERE id = ?',
        [checklistId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe('Updated Checklist');
    });

    it('POST /api/checklists/:checklistId/items - creates a checklist item', async () => {
      const res = await agent
        .post(`/api/checklists/${checklistId}/items`)
        .send({ text: 'First item' })
        .expect(201);

      const body = res.body as unknown as ApiResponse<ChecklistItemResponse>;
      expect(body.data).toHaveProperty('id');
      expect(body.data.text).toBe('First item');
      expect(body.data.is_completed).toBe(false);
      expect(body.data.position).toBe(0);
      itemId = body.data.id;

      const rows = await dataSource.query(
        'SELECT id, text, is_completed, checklist_id, position FROM checklist_items WHERE id = ?',
        [itemId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].text).toBe('First item');
      expect(Number(rows[0].is_completed)).toBe(0);
      expect(rows[0].checklist_id).toBe(checklistId);
      expect(rows[0].position).toBe(0);
    });

    it('PATCH /api/checklist-items/:id - updates item text', async () => {
      const res = await agent
        .patch(`/api/checklist-items/${itemId}`)
        .send({ text: 'Updated item' })
        .expect(200);

      const body = res.body as unknown as ApiResponse<ChecklistItemResponse>;
      expect(body.data.text).toBe('Updated item');

      const rows = await dataSource.query(
        'SELECT id, text, is_completed FROM checklist_items WHERE id = ?',
        [itemId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].text).toBe('Updated item');
      expect(Number(rows[0].is_completed)).toBe(0);
    });

    it('PATCH /api/checklist-items/:id - toggles item completion', async () => {
      const res = await agent
        .patch(`/api/checklist-items/${itemId}`)
        .send({ is_completed: true })
        .expect(200);

      const body = res.body as unknown as ApiResponse<ChecklistItemResponse>;
      expect(body.data.is_completed).toBe(true);

      const rows = await dataSource.query(
        'SELECT id, is_completed FROM checklist_items WHERE id = ?',
        [itemId],
      );
      expect(rows).toHaveLength(1);
      expect(Number(rows[0].is_completed)).toBe(1);
    });

    it('GET /api/checklists/:id - retrieves checklist with items', async () => {
      const res = await agent.get(`/api/checklists/${checklistId}`).expect(200);
      const body = res.body as unknown as ApiResponse<ChecklistResponse>;

      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0].text).toBe('Updated item');
      expect(body.data.items[0].is_completed).toBe(true);
    });

    it('GET /api/cards/:id - card includes checklists in detail response', async () => {
      const res = await agent.get(`/api/cards/${cardId}`).expect(200);
      const body = res.body as unknown as ApiResponse<{ checklists: ChecklistResponse[] }>;

      expect(body.data.checklists).toHaveLength(1);
      expect(body.data.checklists[0].id).toBe(checklistId);
      expect(body.data.checklists[0].items).toHaveLength(1);
      expect(body.data.checklists[0].items[0].text).toBe('Updated item');
    });

    it('DELETE /api/checklist-items/:id - deletes an item', async () => {
      await agent.delete(`/api/checklist-items/${itemId}`).expect(200);

      const res = await agent.get(`/api/checklists/${checklistId}`).expect(200);
      const body = res.body as unknown as ApiResponse<ChecklistResponse>;
      expect(body.data.items).toHaveLength(0);

      const rows = await dataSource.query(
        'SELECT id FROM checklist_items WHERE id = ?',
        [itemId],
      );
      expect(rows).toHaveLength(0);
    });

    it('DELETE /api/checklists/:id - deletes a checklist', async () => {
      await agent.delete(`/api/checklists/${checklistId}`).expect(200);

      const res = await agent.get(`/api/cards/${cardId}`).expect(200);
      const body = res.body as unknown as ApiResponse<{ checklists: ChecklistResponse[] }>;
      expect(body.data.checklists).toHaveLength(0);

      const checklistRows = await dataSource.query(
        'SELECT id FROM checklists WHERE id = ?',
        [checklistId],
      );
      expect(checklistRows).toHaveLength(0);
    });
  });

  describe('Authorization', () => {
    it('should deny access to checklists owned by other users', async () => {
      // Create a checklist for the current user
      const createRes = await agent
        .post(`/api/cards/${cardId}/checklists`)
        .send({ title: 'My Checklist' })
        .expect(201);
      const checklistId = (createRes.body as unknown as ApiResponse<{ id: number }>).data.id;

      // Create another user
      const otherEmail = `other-checklists-${Date.now()}@example.com`;
      const otherAgent = request.agent(url);
      await otherAgent.post('/api/auth/register').send({ email: otherEmail, password: testPassword });
      await otherAgent.post('/api/auth/login').send({ email: otherEmail, password: testPassword });

      // Try to access the first user's checklist
      await otherAgent.get(`/api/checklists/${checklistId}`).expect(403);

      // Cleanup
      await agent.delete(`/api/checklists/${checklistId}`).expect(200);
    });
  });

  describe('Validation', () => {
    it('should reject checklist without title', async () => {
      await agent
        .post(`/api/cards/${cardId}/checklists`)
        .send({})
        .expect(400);
    });

    it('should reject checklist item without text', async () => {
      const createRes = await agent
        .post(`/api/cards/${cardId}/checklists`)
        .send({ title: 'Temp Checklist' })
        .expect(201);
      const checklistId = (createRes.body as unknown as ApiResponse<{ id: number }>).data.id;

      await agent
        .post(`/api/checklists/${checklistId}/items`)
        .send({})
        .expect(400);

      // Cleanup
      await agent.delete(`/api/checklists/${checklistId}`).expect(200);
    });
  });
});
