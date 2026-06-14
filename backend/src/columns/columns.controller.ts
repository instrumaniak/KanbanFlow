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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionGuard } from '../auth/guards/session.guard';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { SortCardsDto } from './dto/sort-cards.dto';
import { MoveCardsDto } from './dto/move-cards.dto';
import { CardResponse, toCardResponse } from '../cards/dto/card-response.dto';

interface SessionData {
  userId: number;
}

interface ColumnResponse {
  id: number;
  name: string;
  position: number;
  board_id: number;
  cards: CardResponse[];
  created_at: string;
  updated_at: string;
}

@Controller('api')
@UseGuards(SessionGuard)
@ApiTags('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get('boards/:boardId/columns')
  @ApiOperation({ summary: 'Get all columns for a board' })
  @ApiParam({ name: 'boardId', type: Number })
  @ApiResponse({ status: 200, description: 'List of columns' })
  async findAll(
    @Session() session: SessionData,
    @Param('boardId', ParseIntPipe) boardId: number,
  ): Promise<{ data: ColumnResponse[] }> {
    const columns = await this.columnsService.findAllByBoardId(boardId, session.userId);
    const data: ColumnResponse[] = columns.map((col) => ({
      id: col.id,
      name: col.name,
      position: col.position,
      board_id: col.board_id,
      cards: col.cards
        ? [...col.cards].sort((a, b) => a.position - b.position).map((c) => toCardResponse(c))
        : [],
      created_at: col.created_at.toISOString(),
      updated_at: col.updated_at.toISOString(),
    }));
    return { data };
  }

  @Post('boards/:boardId/columns')
  @ApiOperation({ summary: 'Create a new column' })
  @ApiParam({ name: 'boardId', type: Number })
  @ApiResponse({ status: 201, description: 'Column created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Session() session: SessionData,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: CreateColumnDto,
  ): Promise<{ data: ColumnResponse; message: string }> {
    const column = await this.columnsService.create(boardId, session.userId, dto);
    const data: ColumnResponse = {
      id: column.id,
      name: column.name,
      position: column.position,
      board_id: column.board_id,
      cards: [],
      created_at: column.created_at.toISOString(),
      updated_at: column.updated_at.toISOString(),
    };
    return { data, message: 'Column created' };
  }

  @Patch('columns/:id')
  @ApiOperation({ summary: 'Update column name' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Column updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColumnDto,
  ): Promise<{ data: ColumnResponse; message: string }> {
    const column = await this.columnsService.update(id, session.userId, dto);
    const data: ColumnResponse = {
      id: column.id,
      name: column.name,
      position: column.position,
      board_id: column.board_id,
      cards: [],
      created_at: column.created_at.toISOString(),
      updated_at: column.updated_at.toISOString(),
    };
    return { data, message: 'Column updated' };
  }

  @Delete('columns/:id')
  @ApiOperation({ summary: 'Delete a column and all its cards' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Column deleted' })
  async remove(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.columnsService.remove(id, session.userId);
    return { message: 'Column deleted' };
  }

  @Patch('columns/:id/sort')
  @ApiOperation({ summary: 'Sort cards by creation date' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cards sorted' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async sort(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SortCardsDto,
  ): Promise<{ data: ColumnResponse; message: string }> {
    const column = await this.columnsService.sortCards(id, session.userId, dto.order);
    const data: ColumnResponse = {
      id: column.id,
      name: column.name,
      position: column.position,
      board_id: column.board_id,
      cards: column.cards
        ? [...column.cards].sort((a, b) => a.position - b.position).map((c) => toCardResponse(c))
        : [],
      created_at: column.created_at.toISOString(),
      updated_at: column.updated_at.toISOString(),
    };
    return { data, message: 'Cards sorted' };
  }

  @Post('columns/:id/move-all')
  @ApiOperation({ summary: 'Move all cards to another column' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cards moved' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async moveAll(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveCardsDto,
  ): Promise<{ data: { movedCount: number }; message: string }> {
    const result = await this.columnsService.moveAllCards(id, dto.targetColumnId, session.userId);
    return {
      data: { movedCount: result.movedCount },
      message: `${result.movedCount} cards moved to ${result.targetName}`,
    };
  }
}
