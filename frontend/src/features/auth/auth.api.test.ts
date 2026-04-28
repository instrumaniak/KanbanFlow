import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerApi, loginApi, meApi, logoutApi } from './auth.api';

global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('auth.api', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('registerApi', () => {
    it('registers user with valid data', async () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com', role: 'user' }, message: 'Registered' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await registerApi({ email: 'test@example.com', password: 'Test1234!' });
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test1234!' }),
      }));
      expect(result).toEqual(mockResponse);
    });

    it('throws error on duplicate email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: () => Promise.resolve({ message: 'Email already registered', error: 'Conflict' }),
      });

      await expect(registerApi({ email: 'exists@example.com', password: 'Test1234!' })).rejects.toThrow('Email already registered');
    });
  });

  describe('loginApi', () => {
    it('logs in with valid credentials', async () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com', role: 'user' }, message: 'Login successful' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await loginApi({ email: 'test@example.com', password: 'Test1234!' });
      expect(result).toEqual(mockResponse);
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(loginApi({ email: 'test@example.com', password: 'Test1234!' })).rejects.toThrow('Network error');
    });

    it('throws error for invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid email or password', error: 'Unauthorized' }),
      });

      await expect(loginApi({ email: 'test@example.com', password: 'WrongPass' })).rejects.toThrow('Invalid email or password');
    });
  });

  describe('meApi', () => {
    it('returns current user when authenticated', async () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com', role: 'user' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await meApi();
      expect(result).toEqual(mockResponse);
    });

    it('throws error when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized', error: 'Unauthorized' }),
      });

      await expect(meApi()).rejects.toThrow('Unauthorized');
    });
  });

  describe('logoutApi', () => {
    it('logs out successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await expect(logoutApi()).resolves.not.toThrow();
    });

    it('throws error on logout failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(logoutApi()).rejects.toThrow();
    });
  });
});