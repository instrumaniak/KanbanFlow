import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColumnsService } from './columns.service';
import { BoardColumn } from './entities/column.entity';
import { Board } from '../boards/entities/board.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ColumnsService', () => {
  let service: ColumnsService;
  let columnRepository: Repository<BoardColumn>;
  let boardRepository: Repository<Board>;

  const mockColumnRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBoardRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnsService,
        {
          provide: getRepositoryToken(BoardColumn),
          useValue: mockColumnRepository,
        },
        {
          provide: getRepositoryToken(Board),
          useValue: mockBoardRepository,
        },
      ],
    }).compile();

    service = module.get<ColumnsService>(ColumnsService);
    columnRepository = module.get<Repository<BoardColumn>>(getRepositoryToken(BoardColumn));
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByBoardId', () => {
    it('should return columns for a board', async () => {
      const mockBoard = { id: 1, user_id: 1 };
      const mockColumns = [
        { id: 1, name: 'To Do', position: 0, board_id: 1, cards: [] },
        { id: 2, name: 'In Progress', position: 1, board_id: 1, cards: [] },
      ];

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockColumnRepository.find.mockResolvedValue(mockColumns);

      const result = await service.findAllByBoardId(1, 1);

      expect(result).toEqual(mockColumns);
      expect(mockBoardRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
      expect(mockColumnRepository.find).toHaveBeenCalledWith({
        where: { board_id: 1 },
        relations: ['cards'],
        order: { position: 'ASC' },
      });
    });

    it('should throw NotFoundException when board not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllByBoardId(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new column', async () => {
      const mockBoard = { id: 1, user_id: 1 };
      const mockColumn = {
        id: 1,
        name: 'New Column',
        position: 0,
        board_id: 1,
      };

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockColumnRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: -1 }),
      });
      mockColumnRepository.create.mockReturnValue(mockColumn);
      mockColumnRepository.save.mockResolvedValue(mockColumn);

      const result = await service.create(1, 1, { name: 'New Column' });

      expect(result).toEqual(mockColumn);
      expect(mockColumnRepository.create).toHaveBeenCalledWith({
        name: 'New Column',
        position: 0,
        board_id: 1,
      });
    });

    it('should use default name when not provided', async () => {
      const mockBoard = { id: 1, user_id: 1 };
      const mockColumn = {
        id: 1,
        name: 'New Column',
        position: 0,
        board_id: 1,
      };

      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockColumnRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: -1 }),
      });
      mockColumnRepository.create.mockReturnValue(mockColumn);
      mockColumnRepository.save.mockResolvedValue(mockColumn);

      await service.create(1, 1, {});

      expect(mockColumnRepository.create).toHaveBeenCalledWith({
        name: 'New Column',
        position: 0,
        board_id: 1,
      });
    });

    it('should throw NotFoundException when board not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(service.create(1, 1, { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update column name', async () => {
      const mockColumn = {
        id: 1,
        name: 'To Do',
        board: { user_id: 1 },
      };
      const updatedColumn = { ...mockColumn, name: 'In Progress' };

      mockColumnRepository.findOne.mockResolvedValue(mockColumn);
      mockColumnRepository.save.mockResolvedValue(updatedColumn);

      const result = await service.update(1, 1, { name: 'In Progress' });

      expect(result.name).toBe('In Progress');
    });

    it('should throw NotFoundException when column not found', async () => {
      mockColumnRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, 1, { name: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own board', async () => {
      const mockColumn = {
        id: 1,
        name: 'To Do',
        board: { user_id: 2 },
      };

      mockColumnRepository.findOne.mockResolvedValue(mockColumn);

      await expect(service.update(1, 1, { name: 'Test' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a column', async () => {
      const mockColumn = {
        id: 1,
        name: 'To Do',
        board: { user_id: 1 },
      };

      mockColumnRepository.findOne.mockResolvedValue(mockColumn);
      mockColumnRepository.remove.mockResolvedValue(mockColumn);

      await service.remove(1, 1);

      expect(mockColumnRepository.remove).toHaveBeenCalledWith(mockColumn);
    });

    it('should throw NotFoundException when column not found', async () => {
      mockColumnRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });
  });
});