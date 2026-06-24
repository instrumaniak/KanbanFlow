import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChecklistsService } from './checklists.service';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { Card } from '../cards/entities/card.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { Board } from '../boards/entities/board.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChecklistsService', () => {
  let service: ChecklistsService;

  const mockUserId = 1;
  const mockBoard = { id: 1, user_id: mockUserId } as Board;
  const mockColumn = { id: 1, board: mockBoard, position: 0 } as BoardColumn;
  const mockCard = {
    id: 1,
    title: 'Test Card',
    column_id: 1,
    column: mockColumn,
  } as Card;

  const mockChecklistRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockChecklistItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCardRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistsService,
        {
          provide: getRepositoryToken(Checklist),
          useValue: mockChecklistRepository,
        },
        {
          provide: getRepositoryToken(ChecklistItem),
          useValue: mockChecklistItemRepository,
        },
        {
          provide: getRepositoryToken(Card),
          useValue: mockCardRepository,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChecklistsService>(ChecklistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a checklist', async () => {
      mockCardRepository.findOne.mockResolvedValue(mockCard);
      mockChecklistRepository.create.mockReturnValue({ id: 1, title: 'My Checklist', card_id: 1 });
      mockChecklistRepository.save.mockResolvedValue({ id: 1, title: 'My Checklist', card_id: 1 });

      const result = await service.create(mockUserId, { title: 'My Checklist', card_id: 1 });

      expect(result).toBeDefined();
      expect(mockChecklistRepository.create).toHaveBeenCalledWith({
        title: 'My Checklist',
        card_id: 1,
      });
      expect(mockChecklistRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(mockUserId, { title: 'My Checklist', card_id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the card', async () => {
      const otherUserCard = {
        ...mockCard,
        column: { ...mockColumn, board: { id: 1, user_id: 999 } },
      };
      mockCardRepository.findOne.mockResolvedValue(otherUserCard);

      await expect(
        service.create(mockUserId, { title: 'My Checklist', card_id: 1 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('should return a checklist with items', async () => {
      const checklist = {
        id: 1,
        title: 'My Checklist',
        card_id: 1,
        card: mockCard,
        items: [{ id: 1, text: 'Item 1', is_completed: false }],
      };
      mockChecklistRepository.findOne.mockResolvedValueOnce(checklist);

      const result = await service.findById(1, mockUserId);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException if checklist does not exist', async () => {
      mockChecklistRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the checklist', async () => {
      const otherUserChecklist = {
        id: 1,
        title: 'My Checklist',
        card_id: 1,
        card: { ...mockCard, column: { ...mockColumn, board: { id: 1, user_id: 999 } } },
      };
      mockChecklistRepository.findOne.mockResolvedValue(otherUserChecklist);

      await expect(service.findById(1, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update checklist title', async () => {
      const checklist = {
        id: 1,
        title: 'Old Title',
        card_id: 1,
        card: mockCard,
      };
      mockChecklistRepository.findOne
        .mockResolvedValueOnce(checklist)
        .mockResolvedValueOnce({ ...checklist, title: 'New Title' });
      mockChecklistRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, mockUserId, { title: 'New Title' });

      expect(result.title).toBe('New Title');
      expect(mockChecklistRepository.update).toHaveBeenCalledWith(1, { title: 'New Title' });
    });

    it('should throw NotFoundException if checklist does not exist', async () => {
      mockChecklistRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, mockUserId, { title: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete checklist', async () => {
      const checklist = {
        id: 1,
        title: 'My Checklist',
        card_id: 1,
        card: mockCard,
      };
      mockChecklistRepository.findOne.mockResolvedValue(checklist);
      mockChecklistRepository.remove.mockResolvedValue(checklist);

      await service.remove(1, mockUserId);

      expect(mockChecklistRepository.remove).toHaveBeenCalledWith(checklist);
    });

    it('should throw NotFoundException if checklist does not exist', async () => {
      mockChecklistRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createItem', () => {
    it('should create a checklist item', async () => {
      const checklist = {
        id: 1,
        title: 'My Checklist',
        card_id: 1,
        card: mockCard,
      };
      mockChecklistRepository.findOne.mockResolvedValue(checklist);
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      };
      mockChecklistItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockChecklistItemRepository.create.mockReturnValue({
        id: 1,
        text: 'New Item',
        checklist_id: 1,
        position: 0,
      });
      mockChecklistItemRepository.save.mockResolvedValue({
        id: 1,
        text: 'New Item',
        checklist_id: 1,
        position: 0,
      });

      const result = await service.createItem(1, mockUserId, { text: 'New Item' });

      expect(result).toBeDefined();
      expect(mockChecklistItemRepository.create).toHaveBeenCalledWith({
        text: 'New Item',
        checklist_id: 1,
        position: 0,
      });
    });

    it('should use provided position', async () => {
      const checklist = {
        id: 1,
        title: 'My Checklist',
        card_id: 1,
        card: mockCard,
      };
      mockChecklistRepository.findOne.mockResolvedValue(checklist);
      mockChecklistItemRepository.create.mockReturnValue({
        id: 1,
        text: 'Item',
        checklist_id: 1,
        position: 5,
      });
      mockChecklistItemRepository.save.mockResolvedValue({
        id: 1,
        text: 'Item',
        checklist_id: 1,
        position: 5,
      });

      const result = await service.createItem(1, mockUserId, { text: 'Item', position: 5 });

      expect(result.position).toBe(5);
      expect(mockChecklistItemRepository.create).toHaveBeenCalledWith({
        text: 'Item',
        checklist_id: 1,
        position: 5,
      });
    });

    it('should throw NotFoundException if checklist does not exist', async () => {
      mockChecklistRepository.findOne.mockResolvedValue(null);

      await expect(service.createItem(999, mockUserId, { text: 'Item' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateItem', () => {
    it('should update item text', async () => {
      const item = {
        id: 1,
        text: 'Old Text',
        is_completed: false,
        checklist_id: 1,
        checklist: {
          id: 1,
          card: mockCard,
        },
      };
      mockChecklistItemRepository.findOne
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce({ ...item, text: 'New Text' });
      mockChecklistItemRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateItem(1, mockUserId, { text: 'New Text' });

      expect(result.text).toBe('New Text');
      expect(mockChecklistItemRepository.update).toHaveBeenCalledWith(1, { text: 'New Text' });
    });

    it('should toggle is_completed', async () => {
      const item = {
        id: 1,
        text: 'Item',
        is_completed: false,
        checklist_id: 1,
        checklist: {
          id: 1,
          card: mockCard,
        },
      };
      mockChecklistItemRepository.findOne
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce({ ...item, is_completed: true });
      mockChecklistItemRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateItem(1, mockUserId, { is_completed: true });

      expect(result.is_completed).toBe(true);
      expect(mockChecklistItemRepository.update).toHaveBeenCalledWith(1, { is_completed: true });
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockChecklistItemRepository.findOne.mockResolvedValue(null);

      await expect(service.updateItem(999, mockUserId, { text: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeItem', () => {
    it('should delete item', async () => {
      const item = {
        id: 1,
        text: 'Item',
        is_completed: false,
        checklist_id: 1,
        checklist: {
          id: 1,
          card: mockCard,
        },
      };
      mockChecklistItemRepository.findOne.mockResolvedValue(item);
      mockChecklistItemRepository.remove.mockResolvedValue(item);

      await service.removeItem(1, mockUserId);

      expect(mockChecklistItemRepository.remove).toHaveBeenCalledWith(item);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockChecklistItemRepository.findOne.mockResolvedValue(null);

      await expect(service.removeItem(999, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });
});
