import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjects,
  createProject as createProjectApi,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  type Project,
} from './projects.api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createProjectApi(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateProjectApi(id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData<{ data: Project[]; total: number }>(['projects']);

      queryClient.setQueryData<{ data: Project[]; total: number }>(['projects'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) => (p.id === id ? { ...p, name } : p)),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects'], context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProjectApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
