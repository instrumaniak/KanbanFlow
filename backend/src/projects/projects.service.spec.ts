import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUserId', () => {
    it('should return projects for a user', async () => {
      const projects = [
        { id: 1, name: 'Project 1', user_id: 1, created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Project 2', user_id: 1, created_at: new Date(), updated_at: new Date() },
      ];
      mockRepository.find.mockResolvedValue(projects);

      const result = await service.findAllByUserId(1);
      expect(result).toEqual(projects);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array when user has no projects', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAllByUserId(999);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a project when found and user owns it', async () => {
      const project = { id: 1, name: 'Project 1', user_id: 1 };
      mockRepository.findOne.mockResolvedValue(project);

      const result = await service.findOne(1, 1);
      expect(result).toEqual(project);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own project', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a project', async () => {
      const dto = { name: 'New Project' };
      const project = { id: 1, name: 'New Project', user_id: 1, created_at: new Date(), updated_at: new Date() };
      mockRepository.create.mockReturnValue(project);
      mockRepository.save.mockResolvedValue(project);

      const result = await service.create(1, dto);
      expect(result).toEqual(project);
      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'New Project', user_id: 1 });
      expect(mockRepository.save).toHaveBeenCalledWith(project);
    });
  });

  describe('update', () => {
    it('should update a project name', async () => {
      const project = { id: 1, name: 'Old Name', user_id: 1, created_at: new Date(), updated_at: new Date() };
      mockRepository.findOne.mockResolvedValue(project);
      mockRepository.save.mockResolvedValue({ ...project, name: 'New Name' });

      const result = await service.update(1, 1, { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException when updating non-existent project', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.update(999, 1, { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, 1);
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1, user_id: 1 });
    });

    it('should throw NotFoundException when deleting non-existent project', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own project', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
