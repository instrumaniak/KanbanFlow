import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBoards, fetchBoard, createBoard, updateBoard, deleteBoard, archiveBoard, restoreBoard, permanentDeleteBoard, fetchArchivedBoards } from './boards.api';

global.fetch = vi.fn();

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('boards.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBoards', () => {
    it('fetches all boards without projectId', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Board 1', background_color: '#fff', project_id: null, created_at: '2024-01-01', updated_at: '2024-01-01' }
        ],
        total: 1
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchBoards();
      expect(mockFetch).toHaveBeenCalledWith('/api/boards', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
    });

    it('fetches boards filtered by projectId', async () => {
      const mockResponse = { data: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await fetchBoards(5);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards?projectId=5', { credentials: 'include' });
    });

    it('throws error on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Unauthorized', error: 'Unauthorized' }),
      });

      await expect(fetchBoards()).rejects.toThrow('Unauthorized');
    });
  });

  describe('fetchBoard', () => {
    it('fetches single board by id', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Board 1', background_color: '#fff', project_id: null, created_at: '2024-01-01', updated_at: '2024-01-01' }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchBoard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createBoard', () => {
    it('creates a new board', async () => {
      const mockResponse = {
        data: { id: 1, name: 'New Board', background_color: '#fff', project_id: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
        message: 'Board created successfully'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await createBoard({ name: 'New Board' });
      expect(mockFetch).toHaveBeenCalledWith('/api/boards', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Board' })
      }));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateBoard', () => {
    it('updates a board', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Updated Board', background_color: '#000', project_id: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
        message: 'Board updated'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await updateBoard(1, { name: 'Updated Board' });
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Board' })
      }));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteBoard', () => {
    it('deletes a board', async () => {
      const mockResponse = { message: 'Board deleted' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await deleteBoard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1', expect.objectContaining({
        method: 'DELETE'
      }));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('archiveBoard', () => {
    it('archives a board', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Board', is_archived: true },
        message: 'Board archived'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await archiveBoard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1/archive', expect.objectContaining({
        method: 'PATCH'
      }));
      expect(result).toEqual(mockResponse);
      expect(result.data.is_archived).toBe(true);
    });

    it('throws error on failed archive', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Board not found', error: 'Not Found' }),
      });

      await expect(archiveBoard(999)).rejects.toThrow('Board not found');
    });
  });

  describe('restoreBoard', () => {
    it('restores an archived board', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Board', is_archived: false },
        message: 'Board restored'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await restoreBoard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1/restore', expect.objectContaining({
        method: 'PATCH'
      }));
      expect(result).toEqual(mockResponse);
      expect(result.data.is_archived).toBe(false);
    });

    it('throws error on failed restore', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Board not found', error: 'Not Found' }),
      });

      await expect(restoreBoard(999)).rejects.toThrow('Board not found');
    });
  });

  describe('permanentDeleteBoard', () => {
    it('permanently deletes an archived board', async () => {
      const mockResponse = { message: 'Board permanently deleted' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await permanentDeleteBoard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/1/permanent', expect.objectContaining({
        method: 'DELETE'
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error if board is not archived', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Board must be archived before permanent deletion', error: 'Bad Request' }),
      });

      await expect(permanentDeleteBoard(1)).rejects.toThrow('Board must be archived before permanent deletion');
    });
  });

  describe('fetchArchivedBoards', () => {
    it('fetches all archived boards', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Archived Board 1', is_archived: true },
          { id: 2, name: 'Archived Board 2', is_archived: true }
        ],
        total: 2
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchArchivedBoards();
      expect(mockFetch).toHaveBeenCalledWith('/api/boards/archived', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
      expect(result.total).toBe(2);
    });

    it('returns empty list when no archived boards', async () => {
      const mockResponse = { data: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchArchivedBoards();
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});