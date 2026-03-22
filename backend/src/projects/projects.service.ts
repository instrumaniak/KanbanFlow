import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAllByUserId(userId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(userId: number, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      name: dto.name,
      user_id: userId,
    });
    return this.projectRepository.save(project);
  }

  async update(id: number, userId: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id, userId);
    project.name = dto.name ?? project.name;
    return this.projectRepository.save(project);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.projectRepository.delete({ id, user_id: userId });
    if (result.affected === 0) {
      throw new NotFoundException('Project not found');
    }
  }
}
