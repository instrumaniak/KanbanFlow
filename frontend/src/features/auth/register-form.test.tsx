import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from './register-form';
import { AuthProvider } from './auth-provider';
import { ToastProvider } from '@/components/ui/use-toast';

vi.mock('./auth.api', () => ({
  registerApi: vi.fn(),
  loginApi: vi.fn(),
  meApi: vi.fn().mockRejectedValue(new Error('Not authenticated')),
  logoutApi: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('renders the form with correct structure', () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your details to register/i)).toBeInTheDocument();
  });

  it('allows form input', () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'Password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('Password123');
    expect(confirmInput).toHaveValue('Password123');
  });

  it('shows validation errors for empty fields on submit', async () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email on submit', async () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  it('shows validation error for weak password on submit', async () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for password without number or special char', async () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'longpassword' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'longpassword' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least 1 number or special character')).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords on submit', async () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Different456' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('renders validation errors with text-destructive class', async () => {
    render(<RegisterForm />, { wrapper: createWrapper() });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      const errorElements = screen.getAllByText(/is required/i);
      errorElements.forEach((el) => {
        expect(el.className).toContain('text-destructive');
      });
    });
  });
});
