import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardColumn } from './entities/column.entity';
import { Board } from '../boards/entities/board.entity';
import { Card } from '../cards/entities/card.entity';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BoardColumn, Board, Card])],
  controllers: [ColumnsController],
  providers: [ColumnsService],
  exports: [ColumnsService],
})
export class ColumnsModule {}
