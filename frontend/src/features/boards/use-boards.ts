import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBoards,
  fetchBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  type CreateBoardData,
  type UpdateBoardData,
} from './boards.api';

export type { Board } from './boards.api';

export function useBoards(projectId?: number) {
  return useQuery({
    queryKey: ['boards', projectId],
    queryFn: () => fetchBoards(projectId),
  });
}

export function useBoard(id: number) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => fetchBoard(id),
    enabled: !!id,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardData) => createBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBoardData }) =>
      updateBoard(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', id] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}