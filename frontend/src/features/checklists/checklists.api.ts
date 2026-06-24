import type { ApiResponse } from '../cards/cards.api';

const FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
};

export interface ChecklistItem {
  id: number;
  text: string;
  is_completed: boolean;
  checklist_id: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: number;
  title: string;
  card_id: number;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateChecklistData {
  title: string;
  card_id: number;
}

export interface UpdateChecklistData {
  title?: string;
}

export interface CreateChecklistItemData {
  text: string;
  position?: number;
}

export interface UpdateChecklistItemData {
  text?: string;
  is_completed?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  const data = await response.json();
  return data as T;
}

export async function createChecklist(data: CreateChecklistData): Promise<ApiResponse<Checklist>> {
  const response = await fetch(
    `/api/cards/${data.card_id}/checklists`,
    {
      ...FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: data.title }),
    },
  );
  return handleResponse<ApiResponse<Checklist>>(response);
}

export async function fetchChecklist(id: number): Promise<ApiResponse<Checklist>> {
  const response = await fetch(`/api/checklists/${id}`, FETCH_OPTIONS);
  return handleResponse<ApiResponse<Checklist>>(response);
}

export async function updateChecklist(id: number, data: UpdateChecklistData): Promise<ApiResponse<Checklist>> {
  const response = await fetch(`/api/checklists/${id}`, {
    ...FETCH_OPTIONS,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Checklist>>(response);
}

export async function deleteChecklist(id: number): Promise<void> {
  const response = await fetch(`/api/checklists/${id}`, {
    ...FETCH_OPTIONS,
    method: 'DELETE',
  });
  await handleResponse<ApiResponse<void>>(response);
}

export async function createChecklistItem(
  checklistId: number,
  data: CreateChecklistItemData,
): Promise<ApiResponse<ChecklistItem>> {
  const response = await fetch(`/api/checklists/${checklistId}/items`, {
    ...FETCH_OPTIONS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<ChecklistItem>>(response);
}

export async function updateChecklistItem(
  itemId: number,
  data: UpdateChecklistItemData,
): Promise<ApiResponse<ChecklistItem>> {
  const response = await fetch(`/api/checklist-items/${itemId}`, {
    ...FETCH_OPTIONS,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<ChecklistItem>>(response);
}

export async function deleteChecklistItem(itemId: number): Promise<void> {
  const response = await fetch(`/api/checklist-items/${itemId}`, {
    ...FETCH_OPTIONS,
    method: 'DELETE',
  });
  await handleResponse<ApiResponse<void>>(response);
}
