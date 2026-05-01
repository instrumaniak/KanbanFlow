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

    if (dto.title !== undefined) {
      card.title = dto.title;
    }

    if (dto.column_id !== undefined) {
      await this.findColumnById(dto.column_id, userId);
      card.column_id = dto.column_id;
    }

    if (dto.position !== undefined) {
      card.position = dto.position;
    }

    return this.cardRepository.save(card);
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
