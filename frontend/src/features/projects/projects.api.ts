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

const FETCH_OPTIONS: RequestInit = { credentials: 'include' };

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
  try {
    return await response.json();
  } catch {
    throw new Error('Unexpected response format');
  }
}

export async function fetchProjects(): Promise<ListResponse<Project>> {
  let response: Response;
  try {
    response = await fetch('/api/projects', FETCH_OPTIONS);
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function createProject(name: string): Promise<ApiResponse<Project>> {
  let response: Response;
  try {
    response = await fetch('/api/projects', {
      ...FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function updateProject(id: number, name: string): Promise<ApiResponse<Project>> {
  let response: Response;
  try {
    response = await fetch(`/api/projects/${id}`, {
      ...FETCH_OPTIONS,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function deleteProject(id: number): Promise<ApiResponse<void>> {
  let response: Response;
  try {
    response = await fetch(`/api/projects/${id}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function recreateProject(name: string): Promise<ApiResponse<Project>> {
  return createProject(name);
}

export type { Project, ApiResponse, ListResponse };
