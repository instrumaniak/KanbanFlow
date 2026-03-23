import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as projectsApiModule from './projects.api';

const originalFetch = global.fetch;

describe('projects.api', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('fetchProjects', () => {
    it('fetches projects successfully', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Project 1', boardCount: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
        ],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await projectsApiModule.fetchProjects();

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', { credentials: 'include' });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }),
      });

      await expect(projectsApiModule.fetchProjects()).rejects.toThrow('Unauthorized');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(projectsApiModule.fetchProjects()).rejects.toThrow('Network error — please check your connection');
    });

    it('handles empty error response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Parse error')),
      });

      await expect(projectsApiModule.fetchProjects()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('createProject', () => {
    it('creates project successfully', async () => {
      const mockResponse = {
        data: { id: 1, name: 'New Project', boardCount: 0, created_at: '', updated_at: '' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await projectsApiModule.createProject('New Project');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Project' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ statusCode: 400, message: 'Name is required', error: 'Bad Request' }),
      });

      await expect(projectsApiModule.createProject('')).rejects.toThrow('Name is required');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(projectsApiModule.createProject('Test')).rejects.toThrow('Network error — please check your connection');
    });
  });

  describe('updateProject', () => {
    it('updates project successfully', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Updated', boardCount: 0, created_at: '', updated_at: '' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await projectsApiModule.updateProject(1, 'Updated');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ statusCode: 404, message: 'Project not found', error: 'Not Found' }),
      });

      await expect(projectsApiModule.updateProject(999, 'Test')).rejects.toThrow('Project not found');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(projectsApiModule.updateProject(1, 'Test')).rejects.toThrow('Network error — please check your connection');
    });
  });

  describe('deleteProject', () => {
    it('deletes project successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(projectsApiModule.deleteProject(1)).resolves.toEqual({ data: undefined });

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
        credentials: 'include',
        method: 'DELETE',
      });
    });

    it('throws error on not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ statusCode: 404, message: 'Project not found', error: 'Not Found' }),
      });

      await expect(projectsApiModule.deleteProject(999)).rejects.toThrow('Project not found');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(projectsApiModule.deleteProject(1)).rejects.toThrow('Network error — please check your connection');
    });
  });

  describe('recreateProject', () => {
    it('delegates to createProject', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Recreated', boardCount: 0, created_at: '', updated_at: '' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await projectsApiModule.recreateProject('Recreated');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Recreated' }),
      });
    });
  });

  describe('type exports', () => {
    it('exports types', () => {
      const projectType: projectsApiModule.Project = { id: 1, name: 'Test', boardCount: 0, created_at: '', updated_at: '' };
      const apiResponse: projectsApiModule.ApiResponse<projectsApiModule.Project> = { data: projectType };
      const listResponse: projectsApiModule.ListResponse<projectsApiModule.Project> = { data: [projectType], total: 1 };
      expect(projectType.id).toBe(1);
      expect(apiResponse.data).toBeDefined();
      expect(listResponse.total).toBe(1);
    });
  });
});
