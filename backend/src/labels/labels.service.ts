import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like } from 'typeorm';
import { Label } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

const defaultLabels = [
  { name: 'Urgent', color: 'red' as const },
  { name: 'Important', color: 'orange' as const },
  { name: 'In Progress', color: 'yellow' as const },
  { name: 'Done', color: 'green' as const },
  { name: 'Bug', color: 'blue' as const },
  { name: 'Feature', color: 'purple' as const },
];

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelsRepository: Repository<Label>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(userId: number): Promise<Label[]> {
    const labels = await this.labelsRepository.find({
      where: { user_id: userId },
      order: { id: 'ASC' },
    });
    if (labels.length === 0) {
      return this.seedDefaultLabels(userId);
    }
    return labels;
  }

  async create(userId: number, dto: CreateLabelDto): Promise<Label> {
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new ConflictException('Label name cannot be empty');
    }

    const existing = await this.labelsRepository.findOne({
      where: {
        user_id: userId,
        name: Like(trimmedName),
      },
    });

    if (existing) {
      throw new ConflictException('Label name already exists');
    }

    const label = this.labelsRepository.create({
      name: trimmedName,
      color: dto.color,
      user_id: userId,
    });

    return this.labelsRepository.save(label);
  }

  async update(id: number, userId: number, dto: UpdateLabelDto): Promise<Label> {
    const label = await this.findLabelById(id, userId);

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new ConflictException('Label name cannot be empty');
      }

      const existing = await this.labelsRepository.findOne({
        where: {
          user_id: userId,
          name: Like(trimmedName),
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Label name already exists');
      }

      label.name = trimmedName;
    }

    return this.labelsRepository.save(label);
  }

  async remove(id: number, userId: number): Promise<void> {
    const label = await this.findLabelById(id, userId);
    await this.labelsRepository.remove(label);
  }

  async seedDefaultLabels(userId: number): Promise<Label[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Label);
      const labels = defaultLabels.map((dl) =>
        repo.create({
          name: dl.name,
          color: dl.color,
          user_id: userId,
        }),
      );
      return repo.save(labels);
    });
  }

  async findLabelById(id: number, userId: number): Promise<Label> {
    const label = await this.labelsRepository.findOne({ where: { id } });
    if (!label) {
      throw new NotFoundException('Label not found');
    }
    if (label.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return label;
  }

  async findById(id: number): Promise<Label | null> {
    return this.labelsRepository.findOne({ where: { id } });
  }
}
