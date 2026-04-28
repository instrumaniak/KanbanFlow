import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBoards, fetchBoard, createBoard, updateBoard, deleteBoard } from './boards.api';

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
});