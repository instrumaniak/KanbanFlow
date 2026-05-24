import { Test, TestingModule } from '@nestjs/testing';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { Label } from './entities/label.entity';

describe('LabelsController', () => {
  let controller: LabelsController;

  const mockLabelsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LabelsController],
      providers: [{ provide: LabelsService, useValue: mockLabelsService }],
    }).compile();

    controller = module.get<LabelsController>(LabelsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all labels for user', async () => {
      const labels = [{ id: 1, name: 'Urgent', color: 'red', user_id: 1 }];
      mockLabelsService.findAll.mockResolvedValue(labels as Label[]);

      const result = await controller.findAll({ userId: 1 });

      expect(result).toEqual({ data: labels });
      expect(mockLabelsService.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a label and return it', async () => {
      const label = { id: 1, name: 'New', color: 'blue', user_id: 1 } as Label;
      mockLabelsService.create.mockResolvedValue(label);

      const result = await controller.create({ userId: 1 }, { name: 'New', color: 'blue' });

      expect(result).toEqual({ data: label, message: 'Label created' });
      expect(mockLabelsService.create).toHaveBeenCalledWith(1, { name: 'New', color: 'blue' });
    });
  });

  describe('update', () => {
    it('should update a label and return it', async () => {
      const label = { id: 1, name: 'Updated', color: 'green', user_id: 1 } as Label;
      mockLabelsService.update.mockResolvedValue(label);

      const result = await controller.update({ userId: 1 }, 1, { name: 'Updated' });

      expect(result).toEqual({ data: label, message: 'Label updated' });
      expect(mockLabelsService.update).toHaveBeenCalledWith(1, 1, { name: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should remove a label', async () => {
      mockLabelsService.remove.mockResolvedValue(undefined);

      await controller.remove({ userId: 1 }, 1);

      expect(mockLabelsService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
