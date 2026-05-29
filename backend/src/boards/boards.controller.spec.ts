import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';

describe('BoardsController', () => {
  let controller: BoardsController;
  const createBoardFixture = (overrides: Partial<Board> = {}): Board =>
    ({
      id: 1,
      name: 'Board',
      background_color: '#0079BF',
      user_id: 1,
      project_id: null,
      is_archived: false,
      user: { id: 1 } as Board['user'],
      project: null,
      created_at: new Date(),
      updated_at: new Date(),
      columns: [],
      ...overrides,
    }) as Board;

  const mockBoardsService: jest.Mocked<
    Pick<
      BoardsService,
      | 'findAllByUserId'
      | 'findAllArchivedByUserId'
      | 'findOne'
      | 'create'
      | 'update'
      | 'remove'
      | 'archive'
      | 'restore'
      | 'permanentDelete'
    >
  > = {
    findAllByUserId: jest.fn(),
    findAllArchivedByUserId: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    permanentDelete: jest.fn(),
  };

  const mockSession = { userId: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [{ provide: BoardsService, useValue: mockBoardsService }],
    }).compile();

    controller = module.get<BoardsController>(BoardsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return list of boards', async () => {
      const boards = [createBoardFixture({ id: 1, name: 'Board 1' })];
      mockBoardsService.findAllByUserId.mockResolvedValue(boards);

      const result = await controller.findAll(mockSession);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by projectId query param', async () => {
      mockBoardsService.findAllByUserId.mockResolvedValue([]);

      await controller.findAll(mockSession, '1');

      expect(mockBoardsService.findAllByUserId).toHaveBeenCalledWith(1, 1, false);
    });
  });

  describe('create', () => {
    it('should create a board and return it with columns', async () => {
      const board = createBoardFixture({
        name: 'New Board',
        columns: [
          { id: 1, name: 'To Do', position: 0 } as Board['columns'][number],
          { id: 2, name: 'In Progress', position: 1 } as Board['columns'][number],
          { id: 3, name: 'Done', position: 2 } as Board['columns'][number],
        ],
      });
      mockBoardsService.create.mockResolvedValue(board);

      const result = await controller.create(mockSession, {
        name: 'New Board',
        background_color: '#0079BF',
      });

      expect(result.data.name).toBe('New Board');
      expect(result.message).toBe('Board created successfully');
    });
  });

  describe('findOne', () => {
    it('should return a single board', async () => {
      const board = createBoardFixture();
      mockBoardsService.findOne.mockResolvedValue(board);

      const result = await controller.findOne(mockSession, 1);

      expect(result.data.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a board', async () => {
      const board = createBoardFixture({ name: 'Updated Board' });
      mockBoardsService.update.mockResolvedValue(board);

      const result = await controller.update(mockSession, 1, { name: 'Updated Board' });

      expect(result.data.name).toBe('Updated Board');
      expect(result.message).toBe('Board updated');
    });
  });

  describe('remove', () => {
    it('should delete a board', async () => {
      mockBoardsService.remove.mockResolvedValue();

      const result = await controller.remove(mockSession, 1);

      expect(result.message).toBe('Board deleted');
    });
  });

  describe('findArchived', () => {
    it('should return list of archived boards', async () => {
      const boards = [createBoardFixture({ name: 'Archived Board', is_archived: true })];
      mockBoardsService.findAllArchivedByUserId.mockResolvedValue(boards);

      const result = await controller.findArchived(mockSession);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockBoardsService.findAllArchivedByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('archive', () => {
    it('should archive a board', async () => {
      const board = createBoardFixture({ is_archived: true });
      mockBoardsService.archive.mockResolvedValue(board);

      const result = await controller.archive(mockSession, 1);

      expect(result.data.is_archived).toBe(true);
      expect(result.message).toBe('Board archived');
      expect(mockBoardsService.archive).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('restore', () => {
    it('should restore an archived board', async () => {
      const board = createBoardFixture({ is_archived: false });
      mockBoardsService.restore.mockResolvedValue(board);

      const result = await controller.restore(mockSession, 1);

      expect(result.data.is_archived).toBe(false);
      expect(result.message).toBe('Board restored');
      expect(mockBoardsService.restore).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('permanentDelete', () => {
    it('should permanently delete an archived board', async () => {
      mockBoardsService.permanentDelete.mockResolvedValue();

      const result = await controller.permanentDelete(mockSession, 1);

      expect(result.message).toBe('Board permanently deleted');
      expect(mockBoardsService.permanentDelete).toHaveBeenCalledWith(1, 1);
    });
  });
});
