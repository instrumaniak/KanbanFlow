import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { BoardColumn } from '../columns/entities/column.entity';
import { Board } from '../boards/entities/board.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async create(userId: number, dto: CreateCardDto): Promise<Card> {
    const column = await this.findColumnById(dto.column_id, userId);

    const maxPositionResult = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.column_id = :columnId', { columnId: dto.column_id })
      .select('MAX(card.position)', 'max')
      .getRawOne();

    const maxPosition = maxPositionResult?.max ?? -1;

    const card = this.cardRepository.create({
      title: dto.title,
      column_id: dto.column_id,
      position: maxPosition + 1,
    });

    return this.cardRepository.save(card);
  }

  async findAllByColumnId(columnId: number, userId: number): Promise<Card[]> {
    await this.findColumnById(columnId, userId);

    return this.cardRepository.find({
      where: { column_id: columnId },
      order: { position: 'ASC' },
    });
  }

  async update(id: number, userId: number, dto: UpdateCardDto): Promise<Card> {
    const card = await this.findCardById(id, userId);
    const oldColumnId = card.column_id;
    const oldPosition = card.position;

    if (dto.title !== undefined) {
      await this.cardRepository.update(id, { title: dto.title });
    }

    if (dto.column_id !== undefined) {
      await this.findColumnById(dto.column_id, userId);
      await this.cardRepository.update(id, { column_id: dto.column_id });
    }

    if (dto.position !== undefined) {
      const targetColumnId = dto.column_id ?? oldColumnId;
      const newPosition = dto.position;

      if (oldColumnId === targetColumnId && oldPosition !== newPosition) {
        await this.reorderWithinColumn(targetColumnId, oldPosition, newPosition);
      } else if (oldColumnId !== targetColumnId) {
        await this.removeFromColumn(oldColumnId, oldPosition);
        const maxPosition = await this.getMaxPositionInColumn(targetColumnId);
        const targetPosition = Math.min(newPosition, maxPosition + 1);
        await this.insertIntoColumn(targetColumnId, targetPosition);
      }
      await this.cardRepository.update(id, { position: dto.position });
    }

    const updated = await this.cardRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException('Card not found after update');
    }
    return updated;
  }

  private async reorderWithinColumn(columnId: number, oldPos: number, newPos: number): Promise<void> {
    const cards = await this.cardRepository.find({
      where: { column_id: columnId },
      order: { position: 'ASC' },
    });

    const updates: Promise<Card>[] = [];
    for (const c of cards) {
      if (oldPos < newPos && c.position > oldPos && c.position <= newPos) {
        c.position -= 1;
        updates.push(this.cardRepository.save(c));
      } else if (oldPos > newPos && c.position >= newPos && c.position < oldPos) {
        c.position += 1;
        updates.push(this.cardRepository.save(c));
      }
    }
    await Promise.all(updates);
  }

  private async removeFromColumn(columnId: number, position: number): Promise<void> {
    const cards = await this.cardRepository.find({
      where: { column_id: columnId },
      order: { position: 'ASC' },
    });

    const updates: Promise<Card>[] = [];
    for (const c of cards) {
      if (c.position > position) {
        c.position -= 1;
        updates.push(this.cardRepository.save(c));
      }
    }
    await Promise.all(updates);
  }

  private async insertIntoColumn(columnId: number, position: number): Promise<void> {
    const cards = await this.cardRepository.find({
      where: { column_id: columnId },
      order: { position: 'ASC' },
    });

    const updates: Promise<Card>[] = [];
    for (const c of cards) {
      if (c.position >= position) {
        c.position += 1;
        updates.push(this.cardRepository.save(c));
      }
    }
    await Promise.all(updates);
  }

  private async getMaxPositionInColumn(columnId: number): Promise<number> {
    const result = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.column_id = :columnId', { columnId })
      .select('MAX(card.position)', 'max')
      .getRawOne();
    return result?.max ?? -1;
  }

  async remove(id: number, userId: number): Promise<void> {
    const card = await this.findCardById(id, userId);
    await this.cardRepository.remove(card);
  }

  private async findCardById(id: number, userId: number): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['column', 'column.board'],
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.column.board.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return card;
  }

  private async findColumnById(id: number, userId: number): Promise<BoardColumn> {
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
