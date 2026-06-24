import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Card } from '../../cards/entities/card.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('checklists')
export class Checklist {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'Setup steps' })
  @Column({ length: 255 })
  title!: string;

  @ApiProperty({ example: 1 })
  @Column()
  card_id!: number;

  @ManyToOne(() => Card, (card) => card.checklists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, { cascade: true })
  items!: ChecklistItem[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updated_at!: Date;
}
