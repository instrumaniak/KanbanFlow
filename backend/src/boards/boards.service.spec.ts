import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';
import { BoardColumn } from '../columns/entities/column.entity';

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepository: jest.Mocked<Repository<Board>>;
  let columnRepository: jest.Mocked<Repository<BoardColumn>>;

  const mockBoardRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockColumnRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: getRepositoryToken(Board), useValue: mockBoardRepository },
        { provide: getRepositoryToken(BoardColumn), useValue: mockColumnRepository },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    boardRepository = module.get(getRepositoryToken(Board));
    columnRepository = module.get(getRepositoryToken(BoardColumn));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByUserId', () => {
    it('should return all boards for a user', async () => {
      const boards = [
        { id: 1, name: 'Board 1', user_id: 1, project_id: null },
        { id: 2, name: 'Board 2', user_id: 1, project_id: 1 },
      ];
      mockBoardRepository.find.mockResolvedValue(boards as Board[]);

      const result = await service.findAllByUserId(1);

      expect(result).toEqual(boards);
      expect(mockBoardRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        relations: ['project'],
        order: { updated_at: 'DESC' },
      });
    });

    it('should filter by projectId when provided', async () => {
      const boards = [{ id: 1, name: 'Board 1', user_id: 1, project_id: 1 }];
      mockBoardRepository.find.mockResolvedValue(boards as Board[]);

      const result = await service.findAllByUserId(1, 1);

      expect(result).toEqual(boards);
      expect(mockBoardRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1, project_id: 1 },
        relations: ['project'],
        order: { updated_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a board if found', async () => {
      const board = {
        id: 1,
        name: 'Board 1',
        user_id: 1,
        columns: [],
      };
      mockBoardRepository.findOne.mockResolvedValue(board as Board);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(board);
    });

    it('should throw NotFoundException if board not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a board with default columns', async () => {
      const createDto = { name: 'New Board', background_color: '#0079BF', project_id: null };
      const savedBoard = { id: 1, ...createDto, user_id: 1, columns: [] };
      const createdBoard = { id: 1, ...createDto, user_id: 1 };

      mockBoardRepository.create.mockReturnValue(createdBoard as Board);
      mockBoardRepository.save.mockResolvedValue(savedBoard as Board);
      mockBoardRepository.findOne.mockResolvedValue(savedBoard as Board);
      mockColumnRepository.create.mockReturnValue([
        { name: 'To Do', position: 0, board_id: 1 },
        { name: 'In Progress', position: 1, board_id: 1 },
        { name: 'Done', position: 2, board_id: 1 },
      ] as BoardColumn[]);
      mockColumnRepository.save.mockResolvedValue([]);

      const result = await service.create(1, createDto);

      expect(result.name).toBe('New Board');
      expect(mockColumnRepository.save).toHaveBeenCalled();
    });

    it('should use default color if not provided', async () => {
      const createDto = { name: 'New Board' };
      const createdBoard = { id: 1, name: 'New Board', background_color: '#0079BF', user_id: 1 };

      mockBoardRepository.create.mockReturnValue(createdBoard as Board);
      mockBoardRepository.save.mockResolvedValue(createdBoard as Board);
      mockBoardRepository.findOne.mockResolvedValue(createdBoard as Board);
      mockColumnRepository.create.mockReturnValue([] as BoardColumn[]);
      mockColumnRepository.save.mockResolvedValue([]);

      const result = await service.create(1, createDto);

      expect(result.background_color).toBe('#0079BF');
    });
  });

  describe('update', () => {
    it('should update board name', async () => {
      const board = { id: 1, name: 'Old Name', background_color: '#0079BF', user_id: 1 };
      const updatedBoard = { ...board, name: 'New Name' };

      mockBoardRepository.findOne.mockResolvedValue(board as Board);
      mockBoardRepository.save.mockResolvedValue(updatedBoard as Board);

      const result = await service.update(1, 1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('should update board color', async () => {
      const board = { id: 1, name: 'Board', background_color: '#0079BF', user_id: 1 };
      const updatedBoard = { ...board, background_color: '#FFAB00' };

      mockBoardRepository.findOne.mockResolvedValue(board as Board);
      mockBoardRepository.save.mockResolvedValue(updatedBoard as Board);

      const result = await service.update(1, 1, { background_color: '#FFAB00' });

      expect(result.background_color).toBe('#FFAB00');
    });

    it('should throw ForbiddenException if project not found or access denied', async () => {
      const board = { id: 1, name: 'Board', background_color: '#0079BF', user_id: 1 };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (mockBoardRepository as any).manager = mockManager;

      mockBoardRepository.findOne.mockResolvedValue(board as Board);

      await expect(
        service.update(1, 1, { project_id: 999 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a board', async () => {
      const board = { id: 1, name: 'Board', user_id: 1, background_color: '#0079BF' };
      mockBoardRepository.findOne.mockResolvedValue(board as Board);
      mockBoardRepository.remove.mockResolvedValue(board as Board);

      await service.remove(1, 1);

      expect(mockBoardRepository.remove).toHaveBeenCalled();
      expect(mockBoardRepository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Board' }),
      );
    });

    it('should throw NotFoundException if board not found', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});