import type { Label } from '../cards/cards.api';

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

export async function fetchLabels(): Promise<ApiResponse<Label[]>> {
  let response: Response;
  try {
    response = await fetch('/api/labels', FETCH_OPTIONS);
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export interface CreateLabelData {
  name: string;
  color: string;
}

export async function createLabel(data: CreateLabelData): Promise<ApiResponse<Label>> {
  let response: Response;
  try {
    response = await fetch('/api/labels', {
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

export interface UpdateLabelData {
  name?: string;
  color?: string;
}

export async function updateLabel(id: number, data: UpdateLabelData): Promise<ApiResponse<Label>> {
  let response: Response;
  try {
    response = await fetch(`/api/labels/${id}`, {
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

export async function deleteLabel(id: number): Promise<ApiResponse<void>> {
  let response: Response;
  try {
    response = await fetch(`/api/labels/${id}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }
  return handleResponse(response);
}

export type { ApiResponse, Label };
