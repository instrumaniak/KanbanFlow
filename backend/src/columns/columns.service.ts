import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn } from './entities/column.entity';
import { Board } from '../boards/entities/board.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async findAllByBoardId(boardId: number, userId: number): Promise<BoardColumn[]> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId, user_id: userId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.columnRepository.find({
      where: { board_id: boardId },
      relations: ['cards'],
      order: { position: 'ASC' },
    });
  }

  async create(boardId: number, userId: number, dto: CreateColumnDto): Promise<BoardColumn> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId, user_id: userId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const maxPositionResult = await this.columnRepository
      .createQueryBuilder('column')
      .where('column.board_id = :boardId', { boardId })
      .select('MAX(column.position)', 'max')
      .getRawOne();

    const maxPosition = maxPositionResult?.max ?? -1;

    const column = this.columnRepository.create({
      name: dto.name || 'New Column',
      position: maxPosition + 1,
      board_id: boardId,
    });

    return this.columnRepository.save(column);
  }

  async update(id: number, userId: number, dto: UpdateColumnDto): Promise<BoardColumn> {
    const column = await this.findOneById(id, userId);

    if (dto.name !== undefined) {
      column.name = dto.name;
    }

    return this.columnRepository.save(column);
  }

  async remove(id: number, userId: number): Promise<void> {
    const column = await this.findOneById(id, userId);
    await this.columnRepository.remove(column);
  }

  private async findOneById(id: number, userId: number): Promise<BoardColumn> {
    const column = await this.columnRepository.findOne({
      where: { id },
      relations: ['board'],
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    if (column.board.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return column;
  }
}