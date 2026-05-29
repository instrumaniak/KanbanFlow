import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  sortCards,
  moveAllCards,
  type CreateColumnData,
  type UpdateColumnData,
  type Column,
} from './columns.api';

export function useColumns(boardId: number) {
  return useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => fetchColumns(boardId).then((res) => res.data),
    enabled: !!boardId,
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: number; data: CreateColumnData }) =>
      createColumn(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateColumnData }) =>
      updateColumn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteColumn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export function useSortCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, order }: { columnId: number; order: 'asc' | 'desc' }) =>
      sortCards(columnId, order),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      queryClient.invalidateQueries({ queryKey: ['board', data.data.board_id] });
    },
  });
}

export function useMoveAllCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceColumnId, targetColumnId }: { sourceColumnId: number; targetColumnId: number }) =>
      moveAllCards(sourceColumnId, targetColumnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export type { Column };
