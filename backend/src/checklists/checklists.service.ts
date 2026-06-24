import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { Card } from '../cards/entities/card.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepository: Repository<ChecklistItem>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: number, dto: CreateChecklistDto): Promise<Checklist> {
    const cardId = dto.card_id;
    if (cardId === undefined) {
      throw new BadRequestException('card_id is required');
    }
    await this.findCardById(cardId, userId);

    const checklist = this.checklistRepository.create({
      title: dto.title,
      card_id: cardId,
    });

    return this.checklistRepository.save(checklist);
  }

  async findAllByCardId(cardId: number, userId: number): Promise<Checklist[]> {
    await this.findCardById(cardId, userId);

    return this.checklistRepository.find({
      where: { card_id: cardId },
      relations: ['items'],
      order: { created_at: 'ASC' },
    });
  }

  async findById(id: number, userId: number): Promise<Checklist> {
    const checklist = await this.findChecklistByIdWithItems(id, userId);
    return checklist;
  }

  async update(id: number, userId: number, dto: UpdateChecklistDto): Promise<Checklist> {
    await this.findChecklistById(id, userId);

    if (dto.title !== undefined) {
      await this.checklistRepository.update(id, { title: dto.title });
    }

    const updated = await this.checklistRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!updated) {
      throw new NotFoundException('Checklist not found after update');
    }

    return updated;
  }

  async remove(id: number, userId: number): Promise<void> {
    const checklist = await this.findChecklistById(id, userId);
    await this.checklistRepository.remove(checklist);
  }

  async createItem(
    checklistId: number,
    userId: number,
    dto: CreateChecklistItemDto,
  ): Promise<ChecklistItem> {
    await this.findChecklistById(checklistId, userId);

    let position: number;
    if (dto.position !== undefined) {
      position = dto.position;
    } else {
      const maxPositionResult = await this.checklistItemRepository
        .createQueryBuilder('item')
        .where('item.checklist_id = :checklistId', { checklistId })
        .select('MAX(item.position)', 'max')
        .getRawOne<{ max: string | number | null }>();
      position = Number(maxPositionResult?.max ?? -1) + 1;
    }

    const item = this.checklistItemRepository.create({
      text: dto.text,
      checklist_id: checklistId,
      position,
    });

    return this.checklistItemRepository.save(item);
  }

  async updateItem(
    id: number,
    userId: number,
    dto: UpdateChecklistItemDto,
  ): Promise<ChecklistItem> {
    await this.findChecklistItemById(id, userId);

    const updateData: Partial<ChecklistItem> = {};
    if (dto.text !== undefined) {
      updateData.text = dto.text;
    }
    if (dto.is_completed !== undefined) {
      updateData.is_completed = dto.is_completed;
    }

    if (Object.keys(updateData).length > 0) {
      await this.checklistItemRepository.update(id, updateData);
    }

    const updated = await this.checklistItemRepository.findOne({ where: { id } });

    if (!updated) {
      throw new NotFoundException('Checklist item not found after update');
    }

    return updated;
  }

  async removeItem(id: number, userId: number): Promise<void> {
    const item = await this.findChecklistItemById(id, userId);
    await this.checklistItemRepository.remove(item);
  }

  private async findChecklistById(id: number, userId: number): Promise<Checklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['card', 'card.column', 'card.column.board'],
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    if (checklist.card.column.board.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return checklist;
  }

  private async findChecklistByIdWithItems(id: number, userId: number): Promise<Checklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['items', 'card', 'card.column', 'card.column.board'],
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    if (checklist.card.column.board.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return checklist;
  }

  private async findChecklistItemById(id: number, userId: number): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findOne({
      where: { id },
      relations: [
        'checklist',
        'checklist.card',
        'checklist.card.column',
        'checklist.card.column.board',
      ],
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    if (item.checklist.card.column.board.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return item;
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
}
