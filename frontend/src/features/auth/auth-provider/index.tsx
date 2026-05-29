import { useCallback, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registerApi, loginApi, meApi, logoutApi } from '../auth.api';
import { AuthContext, type AuthContextType } from '../auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: userResponse, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: meApi,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: async () => {
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });

  const register = useCallback<AuthContextType['register']>(
    async (data) => {
      await registerMutation.mutateAsync(data);
    },
    [registerMutation],
  );

  const login = useCallback<AuthContextType['login']>(
    async (data) => {
      await loginMutation.mutateAsync(data);
    },
    [loginMutation],
  );

  const logout = useCallback<AuthContextType['logout']>(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user: userResponse?.data ?? null,
        isLoading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
