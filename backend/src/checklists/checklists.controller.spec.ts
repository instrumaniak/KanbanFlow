import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';

describe('ChecklistsController', () => {
  let controller: ChecklistsController;

  const mockChecklistsService = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  };

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockChecklistItem: ChecklistItem = {
    id: 1,
    text: 'Buy milk',
    is_completed: false,
    checklist_id: 1,
    position: 0,
    created_at: mockDate,
    updated_at: mockDate,
  } as ChecklistItem;

  const mockChecklist: Checklist = {
    id: 1,
    title: 'Setup steps',
    card_id: 1,
    items: [mockChecklistItem],
    created_at: mockDate,
    updated_at: mockDate,
  } as Checklist;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistsController],
      providers: [{ provide: ChecklistsService, useValue: mockChecklistsService }],
    }).compile();

    controller = module.get<ChecklistsController>(ChecklistsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a checklist and return it with items', async () => {
      mockChecklistsService.create.mockResolvedValue(mockChecklist);

      const result = await controller.create({ userId: 1 }, 1, { title: 'Setup steps' });

      expect(result).toEqual({
        data: {
          id: 1,
          title: 'Setup steps',
          card_id: 1,
          created_at: mockDate.toISOString(),
          updated_at: mockDate.toISOString(),
          items: [
            {
              id: 1,
              text: 'Buy milk',
              is_completed: false,
              checklist_id: 1,
              position: 0,
              created_at: mockDate.toISOString(),
              updated_at: mockDate.toISOString(),
            },
          ],
        },
        message: 'Checklist created',
      });
      expect(mockChecklistsService.create).toHaveBeenCalledWith(1, {
        title: 'Setup steps',
        card_id: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a checklist by id', async () => {
      mockChecklistsService.findById.mockResolvedValue(mockChecklist);

      const result = await controller.findOne({ userId: 1 }, 1);

      expect(result).toEqual({
        data: {
          id: 1,
          title: 'Setup steps',
          card_id: 1,
          created_at: mockDate.toISOString(),
          updated_at: mockDate.toISOString(),
          items: [
            {
              id: 1,
              text: 'Buy milk',
              is_completed: false,
              checklist_id: 1,
              position: 0,
              created_at: mockDate.toISOString(),
              updated_at: mockDate.toISOString(),
            },
          ],
        },
      });
      expect(mockChecklistsService.findById).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('update', () => {
    it('should update a checklist and return it', async () => {
      const updatedChecklist = { ...mockChecklist, title: 'Updated title' };
      mockChecklistsService.update.mockResolvedValue(updatedChecklist);

      const result = await controller.update({ userId: 1 }, 1, { title: 'Updated title' });

      expect(result).toEqual({
        data: {
          id: 1,
          title: 'Updated title',
          card_id: 1,
          created_at: mockDate.toISOString(),
          updated_at: mockDate.toISOString(),
          items: [
            {
              id: 1,
              text: 'Buy milk',
              is_completed: false,
              checklist_id: 1,
              position: 0,
              created_at: mockDate.toISOString(),
              updated_at: mockDate.toISOString(),
            },
          ],
        },
        message: 'Checklist updated',
      });
      expect(mockChecklistsService.update).toHaveBeenCalledWith(1, 1, { title: 'Updated title' });
    });
  });

  describe('remove', () => {
    it('should delete a checklist and return message', async () => {
      mockChecklistsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove({ userId: 1 }, 1);

      expect(result).toEqual({ message: 'Checklist deleted' });
      expect(mockChecklistsService.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('createItem', () => {
    it('should create a checklist item and return it', async () => {
      mockChecklistsService.createItem.mockResolvedValue(mockChecklistItem);

      const result = await controller.createItem({ userId: 1 }, 1, { text: 'Buy milk' });

      expect(result).toEqual({
        data: {
          id: 1,
          text: 'Buy milk',
          is_completed: false,
          checklist_id: 1,
          position: 0,
          created_at: mockDate.toISOString(),
          updated_at: mockDate.toISOString(),
        },
        message: 'Item created',
      });
      expect(mockChecklistsService.createItem).toHaveBeenCalledWith(1, 1, { text: 'Buy milk' });
    });
  });

  describe('updateItem', () => {
    it('should update a checklist item and return it', async () => {
      const updatedItem = {
        ...mockChecklistItem,
        text: 'Updated text',
        is_completed: true,
      } as ChecklistItem;
      mockChecklistsService.updateItem.mockResolvedValue(updatedItem);

      const result = await controller.updateItem({ userId: 1 }, 1, {
        text: 'Updated text',
        is_completed: true,
      });

      expect(result).toEqual({
        data: {
          id: 1,
          text: 'Updated text',
          is_completed: true,
          checklist_id: 1,
          position: 0,
          created_at: mockDate.toISOString(),
          updated_at: mockDate.toISOString(),
        },
        message: 'Item updated',
      });
      expect(mockChecklistsService.updateItem).toHaveBeenCalledWith(1, 1, {
        text: 'Updated text',
        is_completed: true,
      });
    });
  });

  describe('removeItem', () => {
    it('should delete a checklist item and return message', async () => {
      mockChecklistsService.removeItem.mockResolvedValue(undefined);

      const result = await controller.removeItem({ userId: 1 }, 1);

      expect(result).toEqual({ message: 'Item deleted' });
      expect(mockChecklistsService.removeItem).toHaveBeenCalledWith(1, 1);
    });
  });
});
