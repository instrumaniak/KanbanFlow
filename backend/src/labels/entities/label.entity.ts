import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { CardLabel } from '../../cards/entities/card-label.entity';

@Entity('labels')
export class Label {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ApiProperty({ example: 'Urgent' })
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @ApiProperty({ example: 'red' })
  @Column({ type: 'varchar', length: 20 })
  color!: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', name: 'user_id' })
  user_id!: number;

  @ManyToOne(() => User, (user) => user.labels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label)
  cardLabels!: CardLabel[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
