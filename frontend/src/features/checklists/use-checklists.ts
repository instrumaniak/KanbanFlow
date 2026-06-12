import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createChecklist,
  updateChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from './checklists.api';
import type {
  CreateChecklistData,
  UpdateChecklistData,
  CreateChecklistItemData,
  UpdateChecklistItemData,
  ChecklistItem,
  Checklist,
} from './checklists.api';

export const checklistKeys = {
  all: ['checklists'] as const,
  byCard: (cardId: number) => ['checklists', cardId] as const,
};

export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChecklistData) => createChecklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create checklist:', error.message);
    },
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateChecklistData }) =>
      updateChecklist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update checklist:', error.message);
    },
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteChecklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete checklist:', error.message);
    },
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      data,
    }: {
      checklistId: number;
      data: CreateChecklistItemData;
    }) => createChecklistItem(checklistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create checklist item:', error.message);
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number;
      data: UpdateChecklistItemData;
    }) => updateChecklistItem(itemId, data),
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['cards'] });

      const previousCards = queryClient.getQueriesData({ queryKey: ['cards'] });

      queryClient.setQueriesData(
        { queryKey: ['cards'] },
        (old: unknown) => {
          if (!old) return old;
          const data_ = (old as { data?: unknown }).data ?? old;
          if (Array.isArray(data_)) {
            return (data_ as Array<{ checklists?: Array<Checklist & { items: ChecklistItem[] }> }>).map(
              (card) => ({
                ...card,
                checklists: card.checklists?.map((cl) => ({
                  ...cl,
                  items: cl.items.map((item) =>
                    item.id === itemId ? { ...item, ...data } : item
                  ),
                })),
              }),
            );
          }
          return old;
        },
      );

      return { previousCards };
    },
    onError: (_error: Error, _variables, context) => {
      if (context?.previousCards) {
        for (const [key, data] of context.previousCards) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => deleteChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete checklist item:', error.message);
    },
  });
}
