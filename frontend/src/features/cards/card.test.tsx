import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card } from './card';

const mockMutate = vi.fn();
const mockMutateObj = { mutate: mockMutate, mutateAsync: mockMutate };

vi.mock('./use-cards', () => ({
  useUpdateCard: () => mockMutateObj,
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

describe('Card', () => {
  const mockCard = { id: 1, title: 'Test Card', column_id: 1, position: 0, created_at: '2024-01-01', updated_at: '2024-01-01' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders card title', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('enters edit mode when clicked', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    fireEvent.click(screen.getByText('Test Card'));

    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument();
  });

  it('cancels and reverts on Escape key', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    fireEvent.click(screen.getByText('Test Card'));
    fireEvent.change(screen.getByDisplayValue('Test Card'), { target: { value: 'Changed Title' } });
    fireEvent.keyDown(screen.getByDisplayValue('Changed Title'), { key: 'Escape', code: 'Escape' });

    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('reverts empty title on blur', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    fireEvent.click(screen.getByText('Test Card'));
    fireEvent.change(screen.getByDisplayValue('Test Card'), { target: { value: '' } });
    fireEvent.blur(screen.getByDisplayValue(''));

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('calls mutate with correct payload on save', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    fireEvent.click(screen.getByText('Test Card'));
    fireEvent.change(screen.getByDisplayValue('Test Card'), { target: { value: 'New Title' } });
    fireEvent.blur(screen.getByDisplayValue('New Title'));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 1, data: { title: 'New Title' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('optimistically updates UI immediately on save', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    fireEvent.click(screen.getByText('Test Card'));
    fireEvent.change(screen.getByDisplayValue('Test Card'), { target: { value: 'New Title' } });
    fireEvent.blur(screen.getByDisplayValue('New Title'));

    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
  });

  it('handles mutation error gracefully', async () => {
    let errorCallback: ((err: Error) => void) | undefined;
    mockMutate.mockImplementation((_, opts) => {
      errorCallback = opts?.onError;
    });

    renderWithProviders(<Card card={mockCard} index={0} />);

    fireEvent.click(screen.getByText('Test Card'));
    fireEvent.change(screen.getByDisplayValue('Test Card'), { target: { value: 'New Title' } });
    fireEvent.blur(screen.getByDisplayValue('New Title'));

    expect(() => errorCallback?.(new Error('API Error'))).not.toThrow();
  });

  it('triggers edit mode via keyboard Enter', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    const cardDiv = screen.getByRole('button', { name: /edit card title/i });
    fireEvent.keyDown(cardDiv, { key: 'Enter', code: 'Enter' });

    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument();
  });

  it('triggers edit mode via keyboard Space', () => {
    renderWithProviders(<Card card={mockCard} index={0} />);

    const cardDiv = screen.getByRole('button', { name: /edit card title/i });
    fireEvent.keyDown(cardDiv, { key: ' ', code: 'Space' });

    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument();
  });
});