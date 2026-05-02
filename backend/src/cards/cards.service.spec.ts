import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { Board } from '../boards/entities/board.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CardsService', () => {
  let service: CardsService;
  let cardRepository: jest.Mocked<Repository<Card>>;
  let columnRepository: jest.Mocked<Repository<BoardColumn>>;
  let boardRepository: jest.Mocked<Repository<Board>>;

  const mockUserId = 1;
  const mockBoard = { id: 1, user_id: mockUserId } as Board;
  const mockColumn = { id: 1, board: mockBoard, position: 0 } as BoardColumn;
  const mockTargetColumn = { id: 2, board: mockBoard, position: 1 } as BoardColumn;

  const createMockCard = (id: number, columnId: number, position: number): Card =>
    ({
      id,
      title: `Card ${id}`,
      column_id: columnId,
      position,
      column: { ...mockColumn, id: columnId } as BoardColumn,
      created_at: new Date(),
      updated_at: new Date(),
    }) as Card;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: getRepositoryToken(Card),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BoardColumn),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Board),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    cardRepository = module.get(getRepositoryToken(Card));
    columnRepository = module.get(getRepositoryToken(BoardColumn));
    boardRepository = module.get(getRepositoryToken(Board));
  });

  describe('update (reordering)', () => {
    it('should reorder cards when moving down within a column', async () => {
      const cardToMove = createMockCard(1, 1, 0);
      const otherCard = createMockCard(2, 1, 1);
      const targetCard = createMockCard(3, 1, 2);

      cardRepository.findOne.mockResolvedValue(cardToMove);
      cardRepository.find.mockResolvedValue([cardToMove, otherCard, targetCard]);
      cardRepository.save.mockImplementation(async (c) => c as Card);

      await service.update(1, mockUserId, { position: 2 });

      // Card 1: 0 -> 2
      // Card 2: 1 -> 0 (Wait, logic is: if oldPos < newPos && c.position > oldPos && c.position <= newPos then c.position -= 1)
      // Card 2: 1 -> 0
      // Card 3: 2 -> 1

      expect(cardRepository.save).toHaveBeenCalledTimes(3); // 2 shifts + 1 for the moved card
      expect(otherCard.position).toBe(0);
      expect(targetCard.position).toBe(1);
      expect(cardToMove.position).toBe(2);
    });

    it('should reorder cards when moving up within a column', async () => {
      const cardToMove = createMockCard(3, 1, 2);
      const otherCard1 = createMockCard(1, 1, 0);
      const otherCard2 = createMockCard(2, 1, 1);

      cardRepository.findOne.mockResolvedValue(cardToMove);
      cardRepository.find.mockResolvedValue([otherCard1, otherCard2, cardToMove]);
      cardRepository.save.mockImplementation(async (c) => c as Card);

      await service.update(3, mockUserId, { position: 0 });

      // Card 3: 2 -> 0
      // Card 1: 0 -> 1
      // Card 2: 1 -> 2

      expect(cardRepository.save).toHaveBeenCalledTimes(3);
      expect(otherCard1.position).toBe(1);
      expect(otherCard2.position).toBe(2);
      expect(cardToMove.position).toBe(0);
    });

    it('should not perform shifts if moving to the same position', async () => {
      const cardToMove = createMockCard(1, 1, 0);
      cardRepository.findOne.mockResolvedValue(cardToMove);
      cardRepository.save.mockImplementation(async (c) => c as Card);

      await service.update(1, mockUserId, { position: 0 });

      expect(cardRepository.find).not.toHaveBeenCalled();
      expect(cardRepository.save).toHaveBeenCalledTimes(1);
      expect(cardToMove.position).toBe(0);
    });

    it('should handle moving between columns', async () => {
      const cardToMove = createMockCard(1, 1, 0);
      const otherCardInOldCol = createMockCard(2, 1, 1);
      const targetColumnCards = [createMockCard(3, 2, 0), createMockCard(4, 2, 1)];

      cardRepository.findOne.mockResolvedValue(cardToMove);
      columnRepository.findOne.mockResolvedValue(mockTargetColumn);

      // Mock removeFromColumn
      cardRepository.find
        .mockResolvedValueOnce([cardToMove, otherCardInOldCol]) // For removeFromColumn
        .mockResolvedValueOnce(targetColumnCards); // For insertIntoColumn

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 1 }),
      };
      cardRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      cardRepository.save.mockImplementation(async (c) => c as Card);

      await service.update(1, mockUserId, { column_id: 2, position: 0 });

      // removeFromColumn: otherCardInOldCol (1 -> 0)
      // insertIntoColumn: Card 3 (0 -> 1), Card 4 (1 -> 2)
      // Moved card: Card 1 (0 -> 0 in new column)

      expect(otherCardInOldCol.position).toBe(0);
      expect(targetColumnCards[0].position).toBe(1);
      expect(targetColumnCards[1].position).toBe(2);
      expect(cardToMove.column_id).toBe(2);
      expect(cardToMove.position).toBe(0);
    });
  });

  describe('findCardById', () => {
    it('should throw NotFoundException if card does not exist', async () => {
      cardRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the board', async () => {
      const card = createMockCard(1, 1, 0);
      (card.column.board as any).user_id = 999;
      cardRepository.findOne.mockResolvedValue(card);

      await expect(service.remove(1, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });
});
