import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCard,
  updateCard,
  deleteCard,
  fetchCards,
  type CreateCardData,
  type UpdateCardData,
  type Card,
} from './cards.api';

export function useCards(columnId: number) {
  return useQuery({
    queryKey: ['cards', columnId],
    queryFn: () => fetchCards(columnId).then((res) => res.data),
    enabled: !!columnId,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardData) => createCard(data),
    onSuccess: (_, { column_id }) => {
      queryClient.invalidateQueries({ queryKey: ['cards', column_id] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCardData }) =>
      updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCardData }) =>
      updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export type { Card };

export interface DragData {
  cardId: number;
  sourceColumnId: number;
  card: Card;
}