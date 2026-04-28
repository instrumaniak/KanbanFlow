import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Session,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SessionGuard } from '../auth/guards/session.guard';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

interface SessionData {
  userId: number;
}

interface BoardResponse {
  id: number;
  name: string;
  background_color: string;
  project_id: number | null;
  project?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
  columns?: { id: number; name: string; position: number }[];
}

@Controller('api/boards')
@UseGuards(SessionGuard)
@ApiTags('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all boards for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of boards' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async findAll(
    @Session() session: SessionData,
    @Query('projectId') projectId?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    const boards = await this.boardsService.findAllByUserId(
      session.userId,
      projectIdNum,
    );
    const data: BoardResponse[] = boards.map((b) => ({
      id: b.id,
      name: b.name,
      background_color: b.background_color,
      project_id: b.project_id,
      project: b.project ? { id: b.project.id, name: b.project.name } : null,
      created_at: b.created_at.toISOString(),
      updated_at: b.updated_at.toISOString(),
    }));
    return { data, total: data.length };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new board with default columns' })
  @ApiResponse({ status: 201, description: 'Board created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Session() session: SessionData, @Body() dto: CreateBoardDto) {
    const board = await this.boardsService.create(session.userId, dto);
    const data: BoardResponse = {
      id: board.id,
      name: board.name,
      background_color: board.background_color,
      project_id: board.project_id,
      project: board.project ? { id: board.project.id, name: board.project.name } : null,
      created_at: board.created_at.toISOString(),
      updated_at: board.updated_at.toISOString(),
      columns: board.columns.map((c) => ({
        id: c.id,
        name: c.name,
        position: c.position,
      })),
    };
    return { data, message: 'Board created successfully' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single board' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Board details' })
  async findOne(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const board = await this.boardsService.findOne(id, session.userId);
    const data: BoardResponse = {
      id: board.id,
      name: board.name,
      background_color: board.background_color,
      project_id: board.project_id,
      project: board.project ? { id: board.project.id, name: board.project.name } : null,
      created_at: board.created_at.toISOString(),
      updated_at: board.updated_at.toISOString(),
      columns: board.columns.map((c) => ({
        id: c.id,
        name: c.name,
        position: c.position,
      })),
    };
    return { data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update board name, color, or project' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Board updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoardDto,
  ) {
    const board = await this.boardsService.update(id, session.userId, dto);
    const data: BoardResponse = {
      id: board.id,
      name: board.name,
      background_color: board.background_color,
      project_id: board.project_id,
      project: board.project ? { id: board.project.id, name: board.project.name } : null,
      created_at: board.created_at.toISOString(),
      updated_at: board.updated_at.toISOString(),
    };
    return { data, message: 'Board updated' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a board and all its columns/cards' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Board deleted' })
  async remove(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.boardsService.remove(id, session.userId);
    return { message: 'Board deleted' };
  }
}