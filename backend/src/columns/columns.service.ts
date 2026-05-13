import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BoardColumn } from './entities/column.entity';
import { Board } from '../boards/entities/board.entity';
import { Card } from '../cards/entities/card.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
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
      .getRawOne<{ max: string | number | null }>();

    const maxPosition = Number(maxPositionResult?.max ?? -1);

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

  async sortCards(id: number, userId: number, order: 'asc' | 'desc'): Promise<BoardColumn> {
    await this.findOneById(id, userId);

    const cards = await this.cardRepository.find({
      where: { column_id: id },
      order: { created_at: order.toUpperCase() as 'ASC' | 'DESC' },
    });

    for (let i = 0; i < cards.length; i++) {
      cards[i].position = i;
    }
    await this.cardRepository.save(cards);

    const sortedColumn = await this.columnRepository.findOne({
      where: { id },
      relations: ['cards'],
      order: { position: 'ASC' },
    });
    if (!sortedColumn) {
      throw new NotFoundException('Column not found');
    }
    return sortedColumn;
  }

  private async findOneByIdWithCards(id: number, userId: number): Promise<BoardColumn> {
    await this.findOneById(id, userId);
    return (await this.columnRepository.findOne({ where: { id }, relations: ['board', 'cards'] }))!;
  }

  async moveAllCards(
    sourceId: number,
    targetId: number,
    userId: number,
  ): Promise<{ movedCount: number; targetName: string }> {
    const sourceColumn = await this.findOneById(sourceId, userId);
    const targetColumn = await this.findOneById(targetId, userId);

    if (sourceColumn.board_id !== targetColumn.board_id) {
      throw new BadRequestException('Cannot move cards between different boards');
    }

    if (sourceId === targetId) {
      throw new BadRequestException('Cards already in this column');
    }

    const cards = await this.cardRepository.find({
      where: { column_id: sourceId },
    });

    if (cards.length === 0) {
      throw new BadRequestException('No cards to move');
    }

    await this.cardRepository.manager.transaction(async (manager: EntityManager) => {
      const maxPositionResult = await manager
        .createQueryBuilder(Card, 'card')
        .where('card.column_id = :targetId', { targetId })
        .select('MAX(card.position)', 'max')
        .getRawOne<{ max: string | number | null }>();

      let maxPosition = Number(maxPositionResult?.max ?? -1);

      for (const card of cards) {
        card.column_id = targetId;
        card.position = ++maxPosition;
      }

      await manager.save(cards);
    });

    return { movedCount: cards.length, targetName: targetColumn.name };
  }
}
