import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, Like } from 'typeorm';
import { LabelsService } from './labels.service';
import { Label } from './entities/label.entity';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('LabelsService', () => {
  let service: LabelsService;
  let labelsRepository: jest.Mocked<Repository<Label>>;

  const mockUserId = 1;

  const mockLabelsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (callback: (manager: unknown) => Promise<unknown>) => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockLabelsRepository),
      };
      return callback(mockManager);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelsService,
        {
          provide: getRepositoryToken(Label),
          useValue: mockLabelsRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<LabelsService>(LabelsService);
    labelsRepository = module.get(getRepositoryToken(Label));
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return labels for a user', async () => {
      const labels = [
        { id: 1, name: 'Urgent', color: 'red', user_id: mockUserId },
        { id: 2, name: 'Bug', color: 'blue', user_id: mockUserId },
      ];
      mockLabelsRepository.find.mockResolvedValue(labels as Label[]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(labels);
      expect(mockLabelsRepository.find).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        order: { id: 'ASC' },
      });
    });

    it('should seed default labels when user has no labels', async () => {
      mockLabelsRepository.find.mockResolvedValue([]);
      const seededLabels = [
        { id: 1, name: 'Urgent', color: 'red', user_id: mockUserId },
      ];
      mockLabelsRepository.save.mockResolvedValue(seededLabels as Label[]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(seededLabels);
    });
  });

  describe('create', () => {
    it('should create a new label', async () => {
      const dto = { name: '  New Label  ', color: 'purple' as const };
      mockLabelsRepository.findOne.mockResolvedValue(null);
      mockLabelsRepository.create.mockReturnValue({ id: 1, ...dto, user_id: mockUserId } as Label);
      mockLabelsRepository.save.mockResolvedValue({ id: 1, name: 'New Label', color: 'purple', user_id: mockUserId } as Label);

      const result = await service.create(mockUserId, dto);

      expect(result.name).toBe('New Label');
      expect(result.color).toBe('purple');
      expect(mockLabelsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Label',
        color: 'purple',
        user_id: mockUserId,
      }));
    });

    it('should throw ConflictException for empty name', async () => {
      await expect(service.create(mockUserId, { name: '   ', color: 'red' })).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for duplicate name', async () => {
      mockLabelsRepository.findOne.mockResolvedValue({ id: 1, name: 'Existing', user_id: mockUserId } as Label);

      await expect(service.create(mockUserId, { name: 'Existing', color: 'red' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a label name', async () => {
      const label = { id: 1, name: 'Old', color: 'red', user_id: mockUserId } as Label;
      mockLabelsRepository.findOne.mockResolvedValue(label);
      mockLabelsRepository.save.mockResolvedValue({ ...label, name: 'New' } as Label);

      const result = await service.update(1, mockUserId, { name: 'New' });

      expect(result.name).toBe('New');
    });

    it('should throw NotFoundException when label does not exist', async () => {
      mockLabelsRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, mockUserId, { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the label', async () => {
      mockLabelsRepository.findOne.mockResolvedValue({ id: 1, name: 'Label', user_id: 999 } as Label);

      await expect(service.update(1, mockUserId, { name: 'New' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for empty name', async () => {
      mockLabelsRepository.findOne.mockResolvedValue({ id: 1, name: 'Old', user_id: mockUserId } as Label);

      await expect(service.update(1, mockUserId, { name: '   ' })).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for duplicate name', async () => {
      mockLabelsRepository.findOne
        .mockResolvedValueOnce({ id: 1, name: 'Old', user_id: mockUserId } as Label)
        .mockResolvedValueOnce({ id: 2, name: 'Existing', user_id: mockUserId } as Label);

      await expect(service.update(1, mockUserId, { name: 'Existing' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a label', async () => {
      const label = { id: 1, name: 'Label', user_id: mockUserId } as Label;
      mockLabelsRepository.findOne.mockResolvedValue(label);
      mockLabelsRepository.remove.mockResolvedValue(label);

      await service.remove(1, mockUserId);

      expect(mockLabelsRepository.remove).toHaveBeenCalledWith(label);
    });

    it('should throw NotFoundException when label does not exist', async () => {
      mockLabelsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the label', async () => {
      mockLabelsRepository.findOne.mockResolvedValue({ id: 1, name: 'Label', user_id: 999 } as Label);

      await expect(service.remove(1, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('seedDefaultLabels', () => {
    it('should seed default labels for a user', async () => {
      const seededLabels = [
        { id: 1, name: 'Urgent', color: 'red', user_id: mockUserId },
      ];
      mockLabelsRepository.save.mockResolvedValue(seededLabels as Label[]);

      const result = await service.seedDefaultLabels(mockUserId);

      expect(result).toEqual(seededLabels);
      expect(mockLabelsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findLabelById', () => {
    it('should return a label by id', async () => {
      const label = { id: 1, name: 'Label', user_id: mockUserId } as Label;
      mockLabelsRepository.findOne.mockResolvedValue(label);

      const result = await service.findLabelById(1, mockUserId);

      expect(result).toEqual(label);
    });

    it('should throw NotFoundException when label does not exist', async () => {
      mockLabelsRepository.findOne.mockResolvedValue(null);

      await expect(service.findLabelById(999, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the label', async () => {
      mockLabelsRepository.findOne.mockResolvedValue({ id: 1, name: 'Label', user_id: 999 } as Label);

      await expect(service.findLabelById(1, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });
});
