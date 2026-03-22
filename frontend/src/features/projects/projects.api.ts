interface Project {
  id: number;
  name: string;
  boardCount: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface ListResponse<T> {
  data: T[];
  total: number;
}

interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const error: ApiError = await response.json();
      message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    } catch {
      message = response.statusText || 'Request failed';
    }
    throw new Error(message);
  }
  return response.json();
}

export async function fetchProjects(): Promise<ListResponse<Project>> {
  const response = await fetch('/api/projects');
  return handleResponse(response);
}

export async function createProject(name: string): Promise<ApiResponse<Project>> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function updateProject(id: number, name: string): Promise<ApiResponse<Project>> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function deleteProject(id: number): Promise<ApiResponse<void>> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export type { Project, ApiResponse, ListResponse };
