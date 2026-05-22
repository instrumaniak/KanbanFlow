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
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

interface SessionData {
  userId: number;
}

interface CardResponse {
  id: number;
  title: string;
  column_id: number;
  position: number;
  description: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

@Controller('api')
@UseGuards(SessionGuard)
@ApiTags('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('columns/:columnId/cards')
  @ApiOperation({ summary: 'Get all cards for a column' })
  @ApiParam({ name: 'columnId', type: Number })
  @ApiResponse({ status: 200, description: 'List of cards' })
  async findAll(
    @Session() session: SessionData,
    @Param('columnId', ParseIntPipe) columnId: number,
  ): Promise<{ data: CardResponse[] }> {
    const cards = await this.cardsService.findAllByColumnId(columnId, session.userId);
    const data: CardResponse[] = cards.map((card) => ({
      id: card.id,
      title: card.title,
      column_id: card.column_id,
      position: card.position,
      description: card.description,
      due_date: card.due_date ? card.due_date.toISOString() : null,
      created_at: card.created_at.toISOString(),
      updated_at: card.updated_at.toISOString(),
    }));
    return { data };
  }

  @Post('cards')
  @ApiOperation({ summary: 'Create a new card' })
  @ApiResponse({ status: 201, description: 'Card created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Session() session: SessionData,
    @Body() dto: CreateCardDto,
  ): Promise<{ data: CardResponse; message: string }> {
    const card = await this.cardsService.create(session.userId, dto);
    const data: CardResponse = {
      id: card.id,
      title: card.title,
      column_id: card.column_id,
      position: card.position,
      description: card.description,
      due_date: card.due_date ? card.due_date.toISOString() : null,
      created_at: card.created_at.toISOString(),
      updated_at: card.updated_at.toISOString(),
    };
    return { data, message: 'Card created' };
  }

  @Patch('cards/:id')
  @ApiOperation({ summary: 'Update a card' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Card updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCardDto,
  ): Promise<{ data: CardResponse; message: string }> {
    const card = await this.cardsService.update(id, session.userId, dto);
    const data: CardResponse = {
      id: card.id,
      title: card.title,
      column_id: card.column_id,
      position: card.position,
      description: card.description,
      due_date: card.due_date ? card.due_date.toISOString() : null,
      created_at: card.created_at.toISOString(),
      updated_at: card.updated_at.toISOString(),
    };
    return { data, message: 'Card updated' };
  }

  @Delete('cards/:id')
  @ApiOperation({ summary: 'Delete a card' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Card deleted' })
  async remove(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.cardsService.remove(id, session.userId);
    return { message: 'Card deleted' };
  }
}
