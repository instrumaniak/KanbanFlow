import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth-provider';

vi.mock('./auth.api', () => ({
  registerApi: vi.fn(),
  loginApi: vi.fn(),
  meApi: vi.fn(),
  logoutApi: vi.fn(),
}));

import * as authApi from './auth.api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('shows loading state initially', async () => {
      (authApi.meApi as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
    });

    it('sets user to null when not authenticated', async () => {
      (authApi.meApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Not authenticated'),
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
    });

    it('sets user when authenticated', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      (authApi.meApi as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('registers user successfully', async () => {
      (authApi.meApi as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
      });
      (authApi.registerApi as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 1, email: 'new@example.com', role: 'user' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.register({ email: 'new@example.com', password: 'Password123!' });
      });

      expect(authApi.registerApi).toHaveBeenCalled();
      const callArgs = (authApi.registerApi as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.email).toBe('new@example.com');
      expect(callArgs.password).toBe('Password123!');
    });

    it('handles registration error', async () => {
      (authApi.meApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Not authenticated'),
      );
      (authApi.registerApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Email already exists'),
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.register({ email: 'existing@example.com', password: 'Password123!' }),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('logs in user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      (authApi.meApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Not authenticated'),
      );
      (authApi.loginApi as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'Password123!' });
      });

      expect(authApi.loginApi).toHaveBeenCalled();
      const callArgs = (authApi.loginApi as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.email).toBe('test@example.com');
      expect(callArgs.password).toBe('Password123!');
    });

    it('handles login error', async () => {
      (authApi.meApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Not authenticated'),
      );
      (authApi.loginApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Invalid credentials'),
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.login({ email: 'wrong@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('logs out user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      (authApi.meApi as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser });
      (authApi.logoutApi as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toEqual(mockUser);

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logoutApi).toHaveBeenCalled();
    });

    it('handles logout error', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      (authApi.meApi as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser });
      (authApi.logoutApi as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Logout failed'),
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(result.current.logout()).rejects.toThrow('Logout failed');
    });
  });
});

describe('useAuth', () => {
  it('throws error when used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const TestComponent = () => {
      useAuth();
      return <div>Test</div>;
    };

    expect(() => {
      const { result } = renderHook(() => useAuth());
      if (result.error) throw result.error;
    }).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });
});
