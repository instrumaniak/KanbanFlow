import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { Board } from '../boards/entities/board.entity';

describe('CardsService', () => {
  let service: CardsService;

  const mockCardRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockColumnRepository = {
    findOne: jest.fn(),
  };

  const mockBoardRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: getRepositoryToken(Card), useValue: mockCardRepository },
        { provide: getRepositoryToken(BoardColumn), useValue: mockColumnRepository },
        { provide: getRepositoryToken(Board), useValue: mockBoardRepository },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a card with auto-incremented position', async () => {
      const createDto = { title: 'New Card', column_id: 1 };
      const column = { id: 1, board: { user_id: 1 } };
      const savedCard = { id: 1, title: 'New Card', column_id: 1, position: 0 };

      mockColumnRepository.findOne.mockResolvedValue(column as BoardColumn);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      };
      mockCardRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      mockCardRepository.create.mockReturnValue(savedCard as Card);
      mockCardRepository.save.mockResolvedValue(savedCard as Card);

      const result = await service.create(1, createDto);

      expect(result.title).toBe('New Card');
      expect(result.position).toBe(0);
    });

    it('should set correct position when cards exist', async () => {
      const createDto = { title: 'New Card', column_id: 1 };
      const column = { id: 1, board: { user_id: 1 } };
      const savedCard = { id: 2, title: 'New Card', column_id: 1, position: 1 };

      mockColumnRepository.findOne.mockResolvedValue(column as BoardColumn);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
      };
      mockCardRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      mockCardRepository.create.mockReturnValue(savedCard as Card);
      mockCardRepository.save.mockResolvedValue(savedCard as Card);

      const result = await service.create(1, createDto);

      expect(result.position).toBe(1);
    });

    it('should throw NotFoundException if column not found', async () => {
      mockColumnRepository.findOne.mockResolvedValue(null);

      await expect(service.create(1, { title: 'Test', column_id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own column', async () => {
      const column = { id: 1, board: { user_id: 2 } };
      mockColumnRepository.findOne.mockResolvedValue(column as BoardColumn);

      await expect(service.create(1, { title: 'Test', column_id: 1 })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAllByColumnId', () => {
    it('should return all cards for a column', async () => {
      const column = { id: 1, board: { user_id: 1 } };
      const cards = [
        { id: 1, title: 'Card 1', column_id: 1, position: 0 },
        { id: 2, title: 'Card 2', column_id: 1, position: 1 },
      ];

      mockColumnRepository.findOne.mockResolvedValue(column as BoardColumn);
      mockCardRepository.find.mockResolvedValue(cards as Card[]);

      const result = await service.findAllByColumnId(1, 1);

      expect(result).toEqual(cards);
    });

    it('should throw NotFoundException if column not found', async () => {
      mockColumnRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllByColumnId(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update card title', async () => {
      const card = {
        id: 1,
        title: 'Old Title',
        column_id: 1,
        position: 0,
        column: { board: { user_id: 1 } },
      };
      const updatedCard = { ...card, title: 'New Title' };

      mockCardRepository.findOne.mockResolvedValue(card as Card);
      mockCardRepository.save.mockResolvedValue(updatedCard as Card);

      const result = await service.update(1, 1, { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('should update card column_id', async () => {
      const card = {
        id: 1,
        title: 'Card',
        column_id: 1,
        position: 0,
        column: { board: { user_id: 1 } },
      };
      const targetColumn = { id: 2, board: { user_id: 1 } };
      const updatedCard = { ...card, column_id: 2 };

      mockCardRepository.findOne.mockResolvedValue(card as Card);
      mockColumnRepository.findOne.mockResolvedValue(targetColumn as BoardColumn);
      mockCardRepository.save.mockResolvedValue(updatedCard as Card);

      const result = await service.update(1, 1, { column_id: 2 });

      expect(result.column_id).toBe(2);
    });

    it('should update card position', async () => {
      const card = {
        id: 1,
        title: 'Card',
        column_id: 1,
        position: 0,
        column: { board: { user_id: 1 } },
      };
      const updatedCard = { ...card, position: 5 };

      mockCardRepository.findOne.mockResolvedValue(card as Card);
      mockCardRepository.save.mockResolvedValue(updatedCard as Card);

      const result = await service.update(1, 1, { position: 5 });

      expect(result.position).toBe(5);
    });

    it('should throw NotFoundException if card not found', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, 1, { title: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own card', async () => {
      const card = { id: 1, title: 'Card', column: { board: { user_id: 2 } } };
      mockCardRepository.findOne.mockResolvedValue(card as Card);

      await expect(service.update(1, 1, { title: 'Test' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a card', async () => {
      const card = { id: 1, title: 'Card', column_id: 1, column: { board: { user_id: 1 } } };
      mockCardRepository.findOne.mockResolvedValue(card as Card);
      mockCardRepository.remove.mockResolvedValue(card as Card);

      await service.remove(1, 1);

      expect(mockCardRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if card not found', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own card', async () => {
      const card = { id: 1, title: 'Card', column: { board: { user_id: 2 } } };
      mockCardRepository.findOne.mockResolvedValue(card as Card);

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
