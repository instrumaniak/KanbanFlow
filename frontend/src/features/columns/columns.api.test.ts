import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchColumns, createColumn, updateColumn, deleteColumn } from './columns.api';

global.fetch = vi.fn();

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('columns.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchColumns', () => {
    it('fetches columns for a board', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'To Do', position: 0, board_id: 1, cards: [], created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: 2, name: 'In Progress', position: 1, board_id: 1, cards: [], created_at: '2024-01-01', updated_at: '2024-01-01' }
        ] as Column[]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchColumns(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1/columns', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
    });

    it('returns columns sorted by position', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'To Do', position: 0, board_id: 1, cards: [], created_at: '2024-01-01', updated_at: '2024-01-01' }
        ] as Column[]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchColumns(1);
      expect(result.data[0].position).toBe(0);
    });

    it('throws error on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Board not found', error: 'Not Found' }),
      });

      await expect(fetchColumns(999)).rejects.toThrow('Board not found');
    });
  });

  describe('createColumn', () => {
    it('creates a new column', async () => {
      const mockResponse = {
        data: { id: 1, name: 'New Column', position: 2, board_id: 1, cards: [], created_at: '2024-01-01', updated_at: '2024-01-01' } as Column,
        message: 'Column created'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await createColumn(1, { name: 'New Column' });
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1/columns', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Column' })
      }));
      expect(result).toEqual(mockResponse);
    });

    it('creates column with default name when not provided', async () => {
      const mockResponse = {
        data: { id: 1, name: 'New Column', position: 0, board_id: 1, cards: [], created_at: '2024-01-01', updated_at: '2024-01-01' } as Column,
        message: 'Column created'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await createColumn(1, {});
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1/columns', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({})
      }));
      expect(result.data.name).toBe('New Column');
    });

    it('throws error on unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Unauthorized', error: 'Unauthorized' }),
      });

      await expect(createColumn(1, { name: 'Test' })).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateColumn', () => {
    it('updates a column name', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Updated Column', position: 0, board_id: 1, cards: [], created_at: '2024-01-01', updated_at: '2024-01-01' } as Column,
        message: 'Column updated'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await updateColumn(1, { name: 'Updated Column' });
      expect(mockFetch).toHaveBeenCalledWith('/api/columns/1', expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Column' })
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Column not found', error: 'Not Found' }),
      });

      await expect(updateColumn(999, { name: 'Test' })).rejects.toThrow('Column not found');
    });
  });

  describe('deleteColumn', () => {
    it('deletes a column', async () => {
      const mockResponse = { message: 'Column deleted' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await deleteColumn(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/columns/1', expect.objectContaining({
        method: 'DELETE'
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Column not found', error: 'Not Found' }),
      });

      await expect(deleteColumn(999)).rejects.toThrow('Column not found');
    });
  });
});
