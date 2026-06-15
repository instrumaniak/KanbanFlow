import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupFastifySession } from './test-utils';

type LabelResponse = {
  id: number;
  name: string;
  color: string;
  user_id: number;
  created_at: string;
  updated_at: string;
};

type CardResponse = {
  id: number;
  title: string;
  labels: { id: number; name: string; color: string }[];
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

describe('Labels API (e2e)', () => {
  let app: NestFastifyApplication;
  let url: string;
  let agent: ReturnType<typeof request.agent>;
  let boardId: number;
  let projectId: number;
  let columnId: number;
  let cardId: number;

  const testEmail = `labels-e2e-${Date.now()}@example.com`;
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
      .send({ title: 'Label Test Card', column_id: columnId })
      .expect(201);
    cardId = (cardRes.body as unknown as ApiResponse<{ id: number }>).data.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('Default Labels', () => {
    it('GET /api/labels - returns default labels on first fetch', async () => {
      const res = await agent.get('/api/labels').expect(200);
      const body = res.body as unknown as ApiResponse<LabelResponse[]>;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);

      const names = body.data.map((l) => l.name);
      expect(names).toContain('Urgent');
      expect(names).toContain('Bug');
      expect(names).toContain('Feature');
    });
  });

  describe('CRUD Operations', () => {
    let labelId: number;

    it('POST /api/labels - creates a new label', async () => {
      const res = await agent
        .post('/api/labels')
        .send({ name: 'Custom Label', color: 'purple' })
        .expect(201);

      const body = res.body as unknown as ApiResponse<LabelResponse>;
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe('Custom Label');
      expect(body.data.color).toBe('purple');
      expect(body.data).toHaveProperty('user_id');
      labelId = body.data.id;
    });

    it('POST /api/labels - rejects duplicate name', async () => {
      await agent.post('/api/labels').send({ name: 'Custom Label', color: 'blue' }).expect(409);
    });

    it('PATCH /api/labels/:id - updates label name and color', async () => {
      const res = await agent
        .patch(`/api/labels/${labelId}`)
        .send({ name: 'Updated Label', color: 'green' })
        .expect(200);

      const body = res.body as unknown as ApiResponse<LabelResponse>;
      expect(body.data.name).toBe('Updated Label');
      expect(body.data.color).toBe('green');

      // Persistence verification: GET label to confirm update
      const getRes = await agent.get('/api/labels').expect(200);
      const getBody = getRes.body as unknown as ApiResponse<LabelResponse[]>;
      const updatedLabel = getBody.data.find((l) => l.id === labelId);
      expect(updatedLabel).toBeDefined();
      expect(updatedLabel!.name).toBe('Updated Label');
      expect(updatedLabel!.color).toBe('green');
    });

    it('DELETE /api/labels/:id - deletes a label with 204', async () => {
      await agent.delete(`/api/labels/${labelId}`).expect(204);

      // Persistence verification: GET labels to confirm deletion
      const getRes = await agent.get('/api/labels').expect(200);
      const getBody = getRes.body as unknown as ApiResponse<LabelResponse[]>;
      const deleted = getBody.data.find((l) => l.id === labelId);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Label Assignment via Cards API', () => {
    let labelId: number;

    it('POST /api/labels - creates a label for assignment tests', async () => {
      const res = await agent
        .post('/api/labels')
        .send({ name: 'Assignable Label', color: 'red' })
        .expect(201);
      labelId = (res.body as unknown as ApiResponse<LabelResponse>).data.id;
    });

    it('POST /api/cards/:id/labels - assigns label to card', async () => {
      const res = await agent.post(`/api/cards/${cardId}/labels`).send({ labelId }).expect(200);

      const body = res.body as unknown as ApiResponse<CardResponse>;
      expect(body.data.labels).toBeDefined();
      expect(Array.isArray(body.data.labels)).toBe(true);
      const assigned = body.data.labels.find((l) => l.id === labelId);
      expect(assigned).toBeDefined();
      expect(assigned!.name).toBe('Assignable Label');
      expect(assigned!.color).toBe('red');

      // Persistence verification: GET card detail to confirm
      const cardRes = await agent.get(`/api/cards/${cardId}`).expect(200);
      const cardBody = cardRes.body as unknown as ApiResponse<CardResponse>;
      const persisted = cardBody.data.labels.find((l) => l.id === labelId);
      expect(persisted).toBeDefined();
    });

    it('DELETE /api/cards/:id/labels/:labelId - removes label from card', async () => {
      await agent.delete(`/api/cards/${cardId}/labels/${labelId}`).expect(200);

      // Persistence verification: GET card detail to confirm removal
      const cardRes = await agent.get(`/api/cards/${cardId}`).expect(200);
      const cardBody = cardRes.body as unknown as ApiResponse<CardResponse>;
      const removed = cardBody.data.labels.find((l) => l.id === labelId);
      expect(removed).toBeUndefined();
    });
  });

  describe('Authorization', () => {
    it('should deny access to labels owned by other users', async () => {
      const createRes = await agent
        .post('/api/labels')
        .send({ name: 'Private Label', color: 'blue' })
        .expect(201);
      const labelId = (createRes.body as unknown as ApiResponse<{ id: number }>).data.id;

      const otherEmail = `other-labels-${Date.now()}@example.com`;
      const otherAgent = request.agent(url);
      await otherAgent
        .post('/api/auth/register')
        .send({ email: otherEmail, password: testPassword });
      await otherAgent.post('/api/auth/login').send({ email: otherEmail, password: testPassword });

      await otherAgent.get(`/api/labels`).expect(200);
      await otherAgent.patch(`/api/labels/${labelId}`).send({ name: 'Hacked' }).expect(403);
      await otherAgent.delete(`/api/labels/${labelId}`).expect(403);

      await agent.delete(`/api/labels/${labelId}`).expect(204);
    });
  });

  describe('Validation', () => {
    it('POST /api/labels - returns 400 without name', async () => {
      await agent.post('/api/labels').send({ color: 'red' }).expect(400);
    });

    it('POST /api/labels - returns 400 without color', async () => {
      await agent.post('/api/labels').send({ name: 'No Color' }).expect(400);
    });

    it('POST /api/labels - returns 400 with invalid color', async () => {
      await agent.post('/api/labels').send({ name: 'Bad Color', color: 'chartreuse' }).expect(400);
    });

    it('POST /api/labels - returns 400 with empty trimmed name', async () => {
      await agent.post('/api/labels').send({ name: '   ', color: 'red' }).expect(400);
    });
  });
});
