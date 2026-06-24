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
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';

interface SessionData {
  userId: number;
}

interface ChecklistResponse {
  id: number;
  title: string;
  card_id: number;
  created_at: string;
  updated_at: string;
  items: ChecklistItemResponse[];
}

interface ChecklistItemResponse {
  id: number;
  text: string;
  is_completed: boolean;
  checklist_id: number;
  position: number;
  created_at: string;
  updated_at: string;
}

function toChecklistItemResponse(item: ChecklistItem): ChecklistItemResponse {
  return {
    id: item.id,
    text: item.text,
    is_completed: item.is_completed,
    checklist_id: item.checklist_id,
    position: item.position,
    created_at: item.created_at.toISOString(),
    updated_at: item.updated_at.toISOString(),
  };
}

function toChecklistResponse(checklist: Checklist): ChecklistResponse {
  return {
    id: checklist.id,
    title: checklist.title,
    card_id: checklist.card_id,
    created_at: checklist.created_at.toISOString(),
    updated_at: checklist.updated_at.toISOString(),
    items: checklist.items?.map(toChecklistItemResponse) || [],
  };
}

@Controller('api')
@UseGuards(SessionGuard)
@ApiTags('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post('cards/:cardId/checklists')
  @ApiOperation({ summary: 'Create a checklist for a card' })
  @ApiParam({ name: 'cardId', type: Number })
  @ApiResponse({ status: 201, description: 'Checklist created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Session() session: SessionData,
    @Param('cardId', ParseIntPipe) cardId: number,
    @Body() dto: CreateChecklistDto,
  ): Promise<{ data: ChecklistResponse; message: string }> {
    dto.card_id = cardId;
    const checklist = await this.checklistsService.create(session.userId, dto);
    return { data: toChecklistResponse(checklist), message: 'Checklist created' };
  }

  @Get('checklists/:id')
  @ApiOperation({ summary: 'Get a single checklist by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Checklist found' })
  async findOne(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: ChecklistResponse }> {
    const checklist = await this.checklistsService.findById(id, session.userId);
    return { data: toChecklistResponse(checklist) };
  }

  @Patch('checklists/:id')
  @ApiOperation({ summary: 'Update a checklist' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Checklist updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistDto,
  ): Promise<{ data: ChecklistResponse; message: string }> {
    const checklist = await this.checklistsService.update(id, session.userId, dto);
    return { data: toChecklistResponse(checklist), message: 'Checklist updated' };
  }

  @Delete('checklists/:id')
  @ApiOperation({ summary: 'Delete a checklist' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Checklist deleted' })
  async remove(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.checklistsService.remove(id, session.userId);
    return { message: 'Checklist deleted' };
  }

  @Post('checklists/:checklistId/items')
  @ApiOperation({ summary: 'Create a checklist item' })
  @ApiParam({ name: 'checklistId', type: Number })
  @ApiResponse({ status: 201, description: 'Item created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createItem(
    @Session() session: SessionData,
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @Body() dto: CreateChecklistItemDto,
  ): Promise<{ data: ChecklistItemResponse; message: string }> {
    const item = await this.checklistsService.createItem(checklistId, session.userId, dto);
    return { data: toChecklistItemResponse(item), message: 'Item created' };
  }

  @Patch('checklist-items/:id')
  @ApiOperation({ summary: 'Update a checklist item' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateItem(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistItemDto,
  ): Promise<{ data: ChecklistItemResponse; message: string }> {
    const item = await this.checklistsService.updateItem(id, session.userId, dto);
    return { data: toChecklistItemResponse(item), message: 'Item updated' };
  }

  @Delete('checklist-items/:id')
  @ApiOperation({ summary: 'Delete a checklist item' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  async removeItem(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.checklistsService.removeItem(id, session.userId);
    return { message: 'Item deleted' };
  }
}
