import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BoardColumn } from '../../columns/entities/column.entity';

@Entity('cards')
export class Card {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'Buy groceries' })
  @Column({ length: 255 })
  title!: string;

  @ApiProperty({ example: 1 })
  @Column()
  column_id!: number;

  @ManyToOne(() => BoardColumn, (column) => column.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column!: BoardColumn;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  position!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updated_at!: Date;
}
