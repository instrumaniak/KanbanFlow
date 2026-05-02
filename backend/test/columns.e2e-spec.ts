import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Columns API (e2e)', () => {
  let app: INestApplication<App>;
  let agent: any;
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
    projectId = projRes.body.data.id;

    // Create a board
    const boardRes = await agent
      .post('/api/boards')
      .send({ name: 'E2E Board', project_id: projectId })
      .expect(201);
    boardId = boardRes.body.data.id;
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

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('To Do');
      columnId = res.body.data.id;
    });

    it('GET /api/boards/:boardId/columns - retrieves all columns', async () => {
      const res = await agent.get(`/api/boards/${boardId}/columns`).expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toBe('To Do');
    });

    it('PATCH /api/columns/:id - updates a column', async () => {
      const res = await agent
        .patch(`/api/columns/${columnId}`)
        .send({ name: 'Backlog' })
        .expect(200);

      expect(res.body.data.name).toBe('Backlog');
    });

    it('DELETE /api/columns/:id - deletes a column', async () => {
      await agent.delete(`/api/columns/${columnId}`).expect(200);

      const res = await agent.get(`/api/boards/${boardId}/columns`).expect(200);
      const column = res.body.data.find((c: any) => c.id === columnId);
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
      sourceColId = res1.body.data.id;

      const res2 = await agent
        .post(`/api/boards/${boardId}/columns`)
        .send({ name: 'Target' })
        .expect(201);
      targetColId = res2.body.data.id;

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

      expect(res.body.data.movedCount).toBe(1);
    });
  });
});
