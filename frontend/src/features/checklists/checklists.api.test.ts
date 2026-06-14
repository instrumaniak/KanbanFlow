import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createChecklist,
  fetchChecklist,
  updateChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  type Checklist,
  type ChecklistItem,
} from './checklists.api';

global.fetch = vi.fn();

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

const mockChecklist: Checklist = {
  id: 1,
  title: 'My Checklist',
  card_id: 10,
  items: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockChecklistItem: ChecklistItem = {
  id: 1,
  text: 'Task 1',
  is_completed: false,
  checklist_id: 1,
  position: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('checklists.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChecklist', () => {
    it('creates a checklist for a card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockChecklist, message: 'Checklist created' }),
      });

      const result = await createChecklist({ title: 'My Checklist', card_id: 10 });
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/10/checklists', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'My Checklist' }),
      });
      expect(result).toEqual({ data: mockChecklist, message: 'Checklist created' });
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Card not found' }),
      });

      await expect(createChecklist({ title: 'X', card_id: 999 })).rejects.toThrow('Card not found');
    });

    it('throws fallback message when no error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('parse failed')),
      });

      await expect(createChecklist({ title: 'X', card_id: 1 })).rejects.toThrow('Request failed with status 500');
    });
  });

  describe('fetchChecklist', () => {
    it('fetches a checklist by id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockChecklist }),
      });

      const result = await fetchChecklist(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/checklists/1', { credentials: 'include' });
      expect(result).toEqual({ data: mockChecklist });
    });

    it('throws error on not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Checklist not found' }),
      });

      await expect(fetchChecklist(999)).rejects.toThrow('Checklist not found');
    });
  });

  describe('updateChecklist', () => {
    it('updates a checklist title', async () => {
      const updated = { ...mockChecklist, title: 'Updated Checklist' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: updated }),
      });

      const result = await updateChecklist(1, { title: 'Updated Checklist' });
      expect(mockFetch).toHaveBeenCalledWith('/api/checklists/1', {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Checklist' }),
      });
      expect(result).toEqual({ data: updated });
    });

    it('throws on validation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ message: 'Validation failed' }),
      });

      await expect(updateChecklist(1, { title: '' })).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteChecklist', () => {
    it('deletes a checklist (204 no content)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await deleteChecklist(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/checklists/1', {
        credentials: 'include',
        method: 'DELETE',
      });
      expect(result).toBeUndefined();
    });

    it('throws error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Checklist not found' }),
      });

      await expect(deleteChecklist(999)).rejects.toThrow('Checklist not found');
    });
  });

  describe('createChecklistItem', () => {
    it('creates a checklist item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockChecklistItem }),
      });

      const result = await createChecklistItem(1, { text: 'Task 1', position: 0 });
      expect(mockFetch).toHaveBeenCalledWith('/api/checklists/1/items', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Task 1', position: 0 }),
      });
      expect(result).toEqual({ data: mockChecklistItem });
    });

    it('throws on create failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Checklist not found' }),
      });

      await expect(createChecklistItem(999, { text: 'X' })).rejects.toThrow('Checklist not found');
    });
  });

  describe('updateChecklistItem', () => {
    it('updates a checklist item', async () => {
      const updated = { ...mockChecklistItem, is_completed: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: updated }),
      });

      const result = await updateChecklistItem(1, { is_completed: true });
      expect(mockFetch).toHaveBeenCalledWith('/api/checklist-items/1', {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
      expect(result).toEqual({ data: updated });
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Item not found' }),
      });

      await expect(updateChecklistItem(999, { text: 'X' })).rejects.toThrow('Item not found');
    });
  });

  describe('deleteChecklistItem', () => {
    it('deletes a checklist item (204 no content)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await deleteChecklistItem(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/checklist-items/1', {
        credentials: 'include',
        method: 'DELETE',
      });
      expect(result).toBeUndefined();
    });

    it('throws on delete failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Item not found' }),
      });

      await expect(deleteChecklistItem(999)).rejects.toThrow('Item not found');
    });
  });
});
