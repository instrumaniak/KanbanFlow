export interface Label {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  title: string;
  column_id: number;
  position: number;
  description: string | null;
  due_date: string | null;
  labels?: Label[];
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

export interface CreateCardData {
  title: string;
  column_id: number;
  position?: number;
  description?: string;
  due_date?: string;
}

export async function createCard(data: CreateCardData): Promise<ApiResponse<Card>> {
  let response: Response;
  try {
    response = await fetch('/api/cards', {
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

export interface UpdateCardData {
  title?: string;
  column_id?: number;
  position?: number;
  description?: string;
  due_date?: string;
}

export async function updateCard(id: number, data: UpdateCardData): Promise<ApiResponse<Card>> {
  let response: Response;
  try {
    response = await fetch(`/api/cards/${id}`, {
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

export async function deleteCard(id: number): Promise<ApiResponse<void>> {
  let response: Response;
  try {
    response = await fetch(`/api/cards/${id}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function fetchCards(columnId: number): Promise<ApiResponse<Card[]>> {
  let response: Response;
  try {
    response = await fetch(`/api/columns/${columnId}/cards`, FETCH_OPTIONS);
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function assignLabelToCard(cardId: number, labelId: number): Promise<ApiResponse<{ message: string }>> {
  let response: Response;
  try {
    response = await fetch(`/api/cards/${cardId}/labels`, {
      ...FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelId }),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export async function removeLabelFromCard(cardId: number, labelId: number): Promise<ApiResponse<void>> {
  let response: Response;
  try {
    response = await fetch(`/api/cards/${cardId}/labels/${labelId}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export type { ApiResponse };
