import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  const mockColumnId = 1;
  const mockBoardId = 1;

  const mockColumn = {
    id: mockColumnId,
    board_id: mockBoardId,
    name: 'To Do',
    position: 0,
    board: { id: mockBoardId, user_id: mockUserId, name: 'Test Board', created_at: new Date(), updated_at: new Date() },
  };

  const mockCard = {
    id: 1,
    title: 'Test Card',
    column_id: mockColumnId,
    position: 0,
    created_at: new Date(),
    updated_at: new Date(),
    column: mockColumn,
  };

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
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
            }),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a card successfully', async () => {
      columnRepository.findOne.mockResolvedValue(mockColumn as BoardColumn);
      cardRepository.create.mockReturnValue(mockCard as Card);
      cardRepository.save.mockResolvedValue(mockCard as Card);

      const result = await service.create(mockUserId, { title: 'Test Card', column_id: mockColumnId });

      expect(result).toEqual(mockCard);
      expect(cardRepository.create).toHaveBeenCalledWith({
        title: 'Test Card',
        column_id: mockColumnId,
        position: 1,
      });
    });

    it('should throw NotFoundException if column not found', async () => {
      columnRepository.findOne.mockResolvedValue(null);

      await expect(service.create(mockUserId, { title: 'Test Card', column_id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own column', async () => {
      columnRepository.findOne.mockResolvedValue({
        ...mockColumn,
        board: { ...mockColumn.board, user_id: 999 },
      } as BoardColumn);

      await expect(service.create(mockUserId, { title: 'Test Card', column_id: mockColumnId })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAllByColumnId', () => {
    it('should return cards for a column', async () => {
      columnRepository.findOne.mockResolvedValue(mockColumn as BoardColumn);
      cardRepository.find.mockResolvedValue([mockCard as Card]);

      const result = await service.findAllByColumnId(mockColumnId, mockUserId);

      expect(result).toEqual([mockCard]);
    });

    it('should throw NotFoundException if column not found', async () => {
      columnRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllByColumnId(999, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a card title', async () => {
      cardRepository.findOne.mockResolvedValue(mockCard as Card);
      cardRepository.save.mockResolvedValue({ ...mockCard, title: 'Updated Title' } as Card);

      const result = await service.update(mockCard.id, mockUserId, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if card not found', async () => {
      cardRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, mockUserId, { title: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a card', async () => {
      cardRepository.findOne.mockResolvedValue(mockCard as Card);
      cardRepository.remove.mockResolvedValue(mockCard as Card);

      await service.remove(mockCard.id, mockUserId);

      expect(cardRepository.remove).toHaveBeenCalledWith(mockCard);
    });

    it('should throw NotFoundException if card not found', async () => {
      cardRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });
});