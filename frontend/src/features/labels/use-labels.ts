import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  type CreateLabelData,
  type UpdateLabelData,
} from './labels.api';

const labelKeys = {
  all: () => ['labels'] as const,
};

export function useLabels() {
  return useQuery({
    queryKey: labelKeys.all(),
    queryFn: () => fetchLabels().then((res) => res.data),
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabelData) => createLabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.all() });
    },
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLabelData }) =>
      updateLabel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}
