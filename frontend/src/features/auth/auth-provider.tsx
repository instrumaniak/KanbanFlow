import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registerApi, loginApi, meApi, logoutApi } from './auth.api';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (data: { email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: async () => {
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });

  const register = useCallback(
    async (data: { email: string; password: string }) => {
      await registerMutation.mutateAsync(data);
    },
    [registerMutation],
  );

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      await loginMutation.mutateAsync(data);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
