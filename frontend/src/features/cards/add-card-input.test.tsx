import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddCardInput } from './add-card-input';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('./use-cards', () => ({
  useCreateCard: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ data: { id: 1, title: 'Test', column_id: 1, position: 0, created_at: '', updated_at: '' } }),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('AddCardInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "+ Add a card" button when closed', () => {
    renderWithProviders(<AddCardInput columnId={1} />);
    expect(screen.getByText('+ Add a card')).toBeInTheDocument();
  });

  it('opens input when button is clicked', () => {
    renderWithProviders(<AddCardInput columnId={1} />);

    fireEvent.click(screen.getByText('+ Add a card'));

    expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
  });

  it('closes input when Escape is pressed with empty input', () => {
    renderWithProviders(<AddCardInput columnId={1} />);

    fireEvent.click(screen.getByText('+ Add a card'));
    fireEvent.keyDown(screen.getByPlaceholderText('Enter a title...'), { key: 'Escape', code: 'Escape' });

    expect(screen.queryByPlaceholderText('Enter a title...')).not.toBeInTheDocument();
    expect(screen.getByText('+ Add a card')).toBeInTheDocument();
  });
});