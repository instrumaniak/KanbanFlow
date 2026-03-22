import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Project } from '../../projects/entities/project.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true, length: 255 })
  email!: string;

  @ApiHideProperty()
  @Column({ length: 255, select: false })
  password!: string;

  @ApiProperty({ example: 'user' })
  @Column({ default: 'user' })
  role!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Project, (project) => project.user)
  projects!: Project[];
}
