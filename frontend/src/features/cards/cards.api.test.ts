import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCard, updateCard, deleteCard, fetchCards, fetchCard } from './cards.api';

global.fetch = vi.fn();

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('cards.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCards', () => {
    it('fetches all cards for a column', async () => {
      const mockResponse = {
        data: [
          { id: 1, title: 'Card 1', column_id: 1, position: 0, created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: 2, title: 'Card 2', column_id: 1, position: 1, created_at: '2024-01-01', updated_at: '2024-01-01' }
        ]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCards(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/columns/1/cards', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Column not found' }),
      });

      await expect(fetchCards(999)).rejects.toThrow('Column not found');
    });
  });

  describe('fetchCard', () => {
    it('fetches a single card by id', async () => {
      const mockResponse = {
        data: { id: 1, title: 'Card 1', column_id: 1, position: 0, description: 'A detail', created_at: '2024-01-01', updated_at: '2024-01-01' }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/1', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Card not found' }),
      });

      await expect(fetchCard(999)).rejects.toThrow('Card not found');
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(fetchCard(1)).rejects.toThrow('Network error');
    });
  });

  describe('createCard', () => {
    it('creates a new card', async () => {
      const mockResponse = {
        data: { id: 1, title: 'New Card', column_id: 1, position: 0, created_at: '2024-01-01', updated_at: '2024-01-01' },
        message: 'Card created'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await createCard({ title: 'New Card', column_id: 1 });
      expect(mockFetch).toHaveBeenCalledWith('/api/cards', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Card', column_id: 1 })
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Column not found' }),
      });

      await expect(createCard({ title: 'Test', column_id: 999 })).rejects.toThrow('Column not found');
    });
  });

  describe('updateCard', () => {
    it('updates a card title', async () => {
      const mockResponse = {
        data: { id: 1, title: 'Updated Card', column_id: 1, position: 0, created_at: '2024-01-01', updated_at: '2024-01-01' },
        message: 'Card updated'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await updateCard(1, { title: 'Updated Card' });
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/1', expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Card' })
      }));
      expect(result).toEqual(mockResponse);
    });

    it('updates card column and position', async () => {
      const mockResponse = {
        data: { id: 1, title: 'Card', column_id: 2, position: 5, created_at: '2024-01-01', updated_at: '2024-01-01' },
        message: 'Card updated'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await updateCard(1, { column_id: 2, position: 5 });
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/1', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ column_id: 2, position: 5 })
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Card not found' }),
      });

      await expect(updateCard(999, { title: 'Test' })).rejects.toThrow('Card not found');
    });
  });

  describe('deleteCard', () => {
    it('deletes a card', async () => {
      const mockResponse = { message: 'Card deleted' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await deleteCard(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/1', expect.objectContaining({
        method: 'DELETE'
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Card not found' }),
      });

      await expect(deleteCard(999)).rejects.toThrow('Card not found');
    });
  });
});