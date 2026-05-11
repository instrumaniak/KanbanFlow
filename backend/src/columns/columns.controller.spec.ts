import { Test, TestingModule } from '@nestjs/testing';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { BoardColumn } from './entities/column.entity';

describe('ColumnsController', () => {
  let controller: ColumnsController;
  let service: ColumnsService;

  const mockColumnsService = {
    findAllByBoardId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    sortCards: jest.fn(),
    moveAllCards: jest.fn(),
  };

  const mockSession = { userId: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColumnsController],
      providers: [
        {
          provide: ColumnsService,
          useValue: mockColumnsService,
        },
      ],
    }).compile();

    controller = module.get<ColumnsController>(ColumnsController);
    service = module.get<ColumnsService>(ColumnsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return columns for a board', async () => {
      const mockColumns: BoardColumn[] = [
        {
          id: 1,
          name: 'To Do',
          position: 0,
          board_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
          cards: [],
        } as unknown as BoardColumn,
      ];

      mockColumnsService.findAllByBoardId.mockResolvedValue(mockColumns);

      const result = await controller.findAll(mockSession, 1);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('To Do');
      expect(mockColumnsService.findAllByBoardId).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('create', () => {
    it('should create a column', async () => {
      const mockColumn = {
        id: 1,
        name: 'New Column',
        position: 0,
        board_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockColumnsService.create.mockResolvedValue(mockColumn);

      const result = await controller.create(mockSession, 1, { name: 'New Column' });

      expect(result.data.name).toBe('New Column');
      expect(result.message).toBe('Column created');
      expect(mockColumnsService.create).toHaveBeenCalledWith(1, 1, { name: 'New Column' });
    });
  });

  describe('update', () => {
    it('should update a column', async () => {
      const mockColumn = {
        id: 1,
        name: 'Updated Column',
        position: 0,
        board_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockColumnsService.update.mockResolvedValue(mockColumn);

      const result = await controller.update(mockSession, 1, { name: 'Updated Column' });

      expect(result.data.name).toBe('Updated Column');
      expect(result.message).toBe('Column updated');
      expect(mockColumnsService.update).toHaveBeenCalledWith(1, 1, { name: 'Updated Column' });
    });
  });

  describe('remove', () => {
    it('should delete a column', async () => {
      mockColumnsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockSession, 1);

      expect(result.message).toBe('Column deleted');
      expect(mockColumnsService.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('sort', () => {
    it('should sort cards in a column', async () => {
      const mockColumn = {
        id: 1,
        name: 'To Do',
        position: 0,
        board_id: 1,
        cards: [
          {
            id: 1,
            title: 'Card 1',
            column_id: 1,
            position: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockColumnsService.sortCards.mockResolvedValue(mockColumn);

      const result = await controller.sort(mockSession, 1, { order: 'asc' });

      expect(result.data.id).toBe(1);
      expect(result.message).toBe('Cards sorted');
      expect(mockColumnsService.sortCards).toHaveBeenCalledWith(1, 1, 'asc');
    });
  });

  describe('moveAll', () => {
    it('should move all cards to another column', async () => {
      mockColumnsService.moveAllCards.mockResolvedValue({
        movedCount: 2,
        targetName: 'In Progress',
      });

      const result = await controller.moveAll(mockSession, 1, { targetColumnId: 2 });

      expect(result.data.movedCount).toBe(2);
      expect(result.message).toBe('2 cards moved to In Progress');
      expect(mockColumnsService.moveAllCards).toHaveBeenCalledWith(1, 2, 1);
    });
  });
});
