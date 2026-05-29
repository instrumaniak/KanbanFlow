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
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionGuard } from '../auth/guards/session.guard';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { Label } from './entities/label.entity';

interface SessionData {
  userId: number;
}

@ApiTags('labels')
@Controller('api/labels')
@UseGuards(SessionGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all labels for current user' })
  @ApiResponse({ status: 200, description: 'List of labels' })
  async findAll(@Session() session: SessionData): Promise<{ data: Label[] }> {
    const labels = await this.labelsService.findAll(session.userId);
    return { data: labels };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new label' })
  @ApiResponse({ status: 201, description: 'Label created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Session() session: SessionData,
    @Body() dto: CreateLabelDto,
  ): Promise<{ data: Label; message: string }> {
    const label = await this.labelsService.create(session.userId, dto);
    return { data: label, message: 'Label created' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a label' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Label updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabelDto,
  ): Promise<{ data: Label; message: string }> {
    const label = await this.labelsService.update(id, session.userId, dto);
    return { data: label, message: 'Label updated' };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a label' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Label deleted' })
  async remove(
    @Session() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.labelsService.remove(id, session.userId);
  }
}
