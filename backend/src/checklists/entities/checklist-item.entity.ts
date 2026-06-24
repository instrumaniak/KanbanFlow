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
import { Checklist } from './checklist.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'Buy milk' })
  @Column({ length: 255 })
  text!: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  is_completed!: boolean;

  @ApiProperty({ example: 1 })
  @Column()
  checklist_id!: number;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_id' })
  checklist!: Checklist;

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
