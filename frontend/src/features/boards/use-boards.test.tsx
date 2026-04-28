import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBoards, useBoard, useCreateBoard, useUpdateBoard, useDeleteBoard } from './use-boards';

vi.mock('./boards.api', () => ({
  fetchBoards: vi.fn(),
  fetchBoard: vi.fn(),
  createBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));

import { fetchBoards, fetchBoard, createBoard, updateBoard, deleteBoard } from './boards.api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBoards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches boards without projectId', async () => {
    (fetchBoards as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [], total: 0 });
    const { result } = renderHook(() => useBoards(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchBoards).toHaveBeenCalledWith(undefined);
  });

  it('fetches boards with projectId', async () => {
    (fetchBoards as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [], total: 0 });
    const { result } = renderHook(() => useBoards(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchBoards).toHaveBeenCalledWith(5);
  });

  it('passes projectId as undefined when not provided', async () => {
    (fetchBoards as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [], total: 0 });
    renderHook(() => useBoards(), { wrapper: createWrapper() });
    await waitFor(() => expect(fetchBoards).toHaveBeenCalledWith(undefined));
  });
});

describe('useBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches board by id', async () => {
    (fetchBoard as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, name: 'Test', background_color: '#fff', project_id: null, created_at: '', updated_at: '' }
    });
    const { result } = renderHook(() => useBoard(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchBoard).toHaveBeenCalledWith(1);
  });

  it('does not fetch when id is falsy', async () => {
    const { result } = renderHook(() => useBoard(0), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
    expect(fetchBoard).not.toHaveBeenCalled();
  });
});

describe('useCreateBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a board and invalidates queries', async () => {
    (createBoard as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, name: 'New', background_color: '#fff', project_id: null, created_at: '', updated_at: '' }
    });
    const { result } = renderHook(() => useCreateBoard(), { wrapper: createWrapper() });
    result.current.mutate({ name: 'New' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createBoard).toHaveBeenCalledWith({ name: 'New' });
  });
});

describe('useUpdateBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates a board and invalidates queries', async () => {
    (updateBoard as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, name: 'Updated', background_color: '#fff', project_id: null, created_at: '', updated_at: '' }
    });
    const { result } = renderHook(() => useUpdateBoard(), { wrapper: createWrapper() });
    result.current.mutate({ id: 1, data: { name: 'Updated' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateBoard).toHaveBeenCalledWith(1, { name: 'Updated' });
  });
});

describe('useDeleteBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a board and invalidates queries', async () => {
    (deleteBoard as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ message: 'Deleted' });
    const { result } = renderHook(() => useDeleteBoard(), { wrapper: createWrapper() });
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteBoard).toHaveBeenCalledWith(1);
  });
});