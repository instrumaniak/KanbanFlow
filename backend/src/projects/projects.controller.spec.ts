import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockProject = {
    id: 1,
    name: 'Test Project',
    user_id: 1,
    boards: [],
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  };

  const mockProjectsService = {
    findAllByUserId: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSession = { userId: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return projects with board count', async () => {
      mockProjectsService.findAllByUserId.mockResolvedValue([mockProject]);

      const result = await controller.findAll(mockSession);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 1,
        name: 'Test Project',
        boardCount: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });
      expect(result.total).toBe(1);
    });

    it('should return empty array when no projects', async () => {
      mockProjectsService.findAllByUserId.mockResolvedValue([]);
      const result = await controller.findAll(mockSession);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a project and return 201 response', async () => {
      const dto: CreateProjectDto = { name: 'New Project' };
      const newProject = { ...mockProject, id: 2, name: 'New Project' };
      mockProjectsService.create.mockResolvedValue(newProject);

      const result = await controller.create(mockSession, dto);
      expect(result.data.name).toBe('New Project');
      expect(result.data.boardCount).toBe(0);
      expect(result.message).toBe('Project created');
      expect(mockProjectsService.create).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('update', () => {
    it('should update a project name', async () => {
      const dto: UpdateProjectDto = { name: 'Updated Name' };
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(mockSession, 1, dto);
      expect(result.data.name).toBe('Updated Name');
      expect(result.message).toBe('Project updated');
      expect(mockProjectsService.update).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockSession, 1);
      expect(result.message).toBe('Project deleted');
      expect(mockProjectsService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
