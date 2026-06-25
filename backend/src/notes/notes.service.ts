import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Note } from './entities/note.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Board } from '../boards/entities/board.entity';
import { Project } from '../projects/entities/project.entity';
import { Card } from '../cards/entities/card.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ListNotesDto, NoteType } from './dto/list-notes.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(userId: number, dto: CreateNoteDto): Promise<Note> {
    let tags: Tag[] = [];
    if (dto.tagIds && dto.tagIds.length > 0) {
      tags = await this.tagRepository.findBy({ id: In(dto.tagIds) });
      for (const tag of tags) {
        if (tag.user_id !== userId) {
          throw new ForbiddenException(`Tag ${tag.id} does not belong to user`);
        }
      }
    }

    const note = this.noteRepository.create({
      title: dto.title,
      content: dto.content,
      board_id: dto.board_id ?? null,
      project_id: dto.project_id ?? null,
      card_id: dto.card_id ?? null,
      user_id: userId,
      tags,
    });

    return this.noteRepository.save(note);
  }

  async findAll(userId: number, query: ListNotesDto): Promise<Note[]> {
    const qb = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.tags', 'tag')
      .where('note.user_id = :userId', { userId });

    if (query.search) {
      qb.andWhere('note.title LIKE :search', { search: `%${query.search}%` });
    }

    if (query.type) {
      switch (query.type) {
        case NoteType.BOARD:
          qb.andWhere('note.board_id IS NOT NULL');
          break;
        case NoteType.PROJECT:
          qb.andWhere('note.project_id IS NOT NULL');
          break;
        case NoteType.CARD:
          qb.andWhere('note.card_id IS NOT NULL');
          break;
        case NoteType.GENERAL:
          qb.andWhere('note.board_id IS NULL AND note.project_id IS NULL AND note.card_id IS NULL');
          break;
      }
    }

    if (query.tagId) {
      qb.andWhere('tag.id = :tagId', { tagId: query.tagId });
    }

    if (query.boardId) {
      qb.andWhere('note.board_id = :boardId', { boardId: query.boardId });
    }

    qb.orderBy('note.updated_at', 'DESC');

    return qb.getMany();
  }

  async findById(id: number, userId: number): Promise<Note> {
    return this.findNoteById(id, userId);
  }

  async findByBoardId(boardId: number, userId: number): Promise<Note[]> {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    if (board.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.noteRepository.find({
      where: { board_id: boardId },
      relations: ['tags'],
      order: { updated_at: 'DESC' },
    });
  }

  async update(id: number, userId: number, dto: UpdateNoteDto): Promise<Note> {
    await this.findNoteById(id, userId);

    const updateData: Partial<Note> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.board_id !== undefined) updateData.board_id = dto.board_id;
    if (dto.project_id !== undefined) updateData.project_id = dto.project_id;
    if (dto.card_id !== undefined) updateData.card_id = dto.card_id;

    if (Object.keys(updateData).length > 0) {
      await this.noteRepository.update(id, updateData);
    }

    if (dto.tagIds !== undefined) {
      let tags: Tag[] = [];
      if (dto.tagIds.length > 0) {
        tags = await this.tagRepository.findBy({ id: In(dto.tagIds) });
        for (const tag of tags) {
          if (tag.user_id !== userId) {
            throw new ForbiddenException(`Tag ${tag.id} does not belong to user`);
          }
        }
      }
      const noteToUpdate = await this.noteRepository.findOne({
        where: { id },
        relations: ['tags'],
      });
      if (noteToUpdate) {
        noteToUpdate.tags = tags;
        await this.noteRepository.save(noteToUpdate);
      }
    }

    const updated = await this.noteRepository.findOne({
      where: { id },
      relations: ['tags'],
    });

    if (!updated) {
      throw new NotFoundException('Note not found after update');
    }

    return updated;
  }

  async remove(id: number, userId: number): Promise<void> {
    const note = await this.findNoteById(id, userId);
    await this.noteRepository.remove(note);
  }

  private async findNoteById(id: number, userId: number): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id },
      relations: ['board', 'tags'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.board_id && note.board) {
      if (note.board.user_id !== userId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (note.project_id) {
      const project = await this.projectRepository.findOne({
        where: { id: note.project_id },
      });
      if (!project || project.user_id !== userId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (note.card_id) {
      const card = await this.cardRepository.findOne({
        where: { id: note.card_id },
        relations: ['column', 'column.board'],
      });
      if (!card || card.column.board.user_id !== userId) {
        throw new ForbiddenException('Access denied');
      }
    } else {
      if (note.user_id !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return note;
  }
}
