import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  type CreateLabelData,
  type UpdateLabelData,
} from './labels.api';

global.fetch = vi.fn();

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

const mockLabel = { id: 1, name: 'Bug', color: '#ff0000', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' };

describe('labels.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchLabels', () => {
    it('fetches all labels', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockLabel] }),
      });

      const result = await fetchLabels();
      expect(mockFetch).toHaveBeenCalledWith('/api/labels', { credentials: 'include' });
      expect(result).toEqual({ data: [mockLabel] });
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchLabels()).rejects.toThrow('Network error — please check your connection');
    });

    it('throws error from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(fetchLabels()).rejects.toThrow('Server error');
    });
  });

  describe('createLabel', () => {
    it('creates a new label', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLabel, message: 'Label created' }),
      });

      const data: CreateLabelData = { name: 'Bug', color: '#ff0000' };
      const result = await createLabel(data);
      expect(mockFetch).toHaveBeenCalledWith('/api/labels', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      expect(result).toEqual({ data: mockLabel, message: 'Label created' });
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(createLabel({ name: 'X', color: '#fff' })).rejects.toThrow('Network error — please check your connection');
    });

    it('throws array error message joined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ message: ['Name is required', 'Color is invalid'] }),
      });

      await expect(createLabel({ name: '', color: '' as any })).rejects.toThrow('Name is required, Color is invalid');
    });
  });

  describe('updateLabel', () => {
    it('updates a label name', async () => {
      const updated = { ...mockLabel, name: 'Critical' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: updated }),
      });

      const data: UpdateLabelData = { name: 'Critical' };
      const result = await updateLabel(1, data);
      expect(mockFetch).toHaveBeenCalledWith('/api/labels/1', {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      expect(result).toEqual({ data: updated });
    });

    it('updates a label color', async () => {
      const updated = { ...mockLabel, color: '#00ff00' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: updated }),
      });

      const result = await updateLabel(1, { color: '#00ff00' });
      expect(result.data.color).toBe('#00ff00');
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateLabel(1, { name: 'X' })).rejects.toThrow('Network error — please check your connection');
    });

    it('throws error on not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Label not found' }),
      });

      await expect(updateLabel(999, { name: 'X' })).rejects.toThrow('Label not found');
    });
  });

  describe('deleteLabel', () => {
    it('deletes a label (204 no content)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await deleteLabel(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/labels/1', {
        credentials: 'include',
        method: 'DELETE',
      });
      expect(result).toBeUndefined();
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(deleteLabel(999)).rejects.toThrow('Network error — please check your connection');
    });

    it('throws error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Label not found' }),
      });

      await expect(deleteLabel(999)).rejects.toThrow('Label not found');
    });
  });
});
