import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Session,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionGuard } from '../auth/guards/session.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

interface SessionData {
  userId: number;
}

interface ProjectResponse {
  id: number;
  name: string;
  boardCount: number;
  created_at: string;
  updated_at: string;
}

@Controller('api/projects')
@UseGuards(SessionGuard)
@ApiTags('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async findAll(@Session() session: SessionData) {
    const projects = await this.projectsService.findAllByUserId(session.userId);
    const data: ProjectResponse[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      boardCount: 0,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    }));
    return { data, total: data.length };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Session() session: SessionData, @Body() dto: CreateProjectDto) {
    const project = await this.projectsService.create(session.userId, dto);
    const data: ProjectResponse = {
      id: project.id,
      name: project.name,
      boardCount: 0,
      created_at: project.created_at.toISOString(),
      updated_at: project.updated_at.toISOString(),
    };
    return { data, message: 'Project created' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project name' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    if (!dto.name) {
      throw new BadRequestException('At least one field must be provided');
    }
    const project = await this.projectsService.update(id, session.userId, dto);
    const data: ProjectResponse = {
      id: project.id,
      name: project.name,
      boardCount: 0,
      created_at: project.created_at.toISOString(),
      updated_at: project.updated_at.toISOString(),
    };
    return { data, message: 'Project updated' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project and all its boards' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async remove(@Session() session: SessionData, @Param('id', ParseIntPipe) id: number) {
    await this.projectsService.remove(id, session.userId);
    return { message: 'Project deleted' };
  }
}
