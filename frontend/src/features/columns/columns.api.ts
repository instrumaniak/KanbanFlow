export interface Card {
  id: number;
  title: string;
}

export interface Column {
  id: number;
  name: string;
  position: number;
  board_id: number;
  cards: Card[];
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

const FETCH_OPTIONS: RequestInit = { credentials: 'include' };

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const error = await response.json();
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

export async function fetchColumns(boardId: number): Promise<ApiResponse<Column[]>> {
  let response: Response;
  try {
    response = await fetch(`/api/boards/${boardId}/columns`, FETCH_OPTIONS);
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export interface CreateColumnData {
  name?: string;
}

export async function createColumn(boardId: number, data: CreateColumnData): Promise<ApiResponse<Column>> {
  let response: Response;
  try {
    response = await fetch(`/api/boards/${boardId}/columns`, {
      ...FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export interface UpdateColumnData {
  name?: string;
}

export async function updateColumn(id: number, data: UpdateColumnData): Promise<ApiResponse<Column>> {
  let response: Response;
  try {
    response = await fetch(`/api/columns/${id}`, {
      ...FETCH_OPTIONS,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function deleteColumn(id: number): Promise<ApiResponse<void>> {
  let response: Response;
  try {
    response = await fetch(`/api/columns/${id}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export type { ApiResponse };