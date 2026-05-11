import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card } from './card';

const mockMutate = vi.fn();
const mockMutateAsync = vi.fn();
const mockMutateObj = { mutate: mockMutate, mutateAsync: mockMutateAsync, isPending: false };
const mockDeleteMutate = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockDeleteMutateObj = { mutate: mockDeleteMutate, mutateAsync: mockDeleteMutateAsync, isPending: false };
const mockCreateMutateAsync = vi.fn();
const mockCreateMutateObj = { mutate: vi.fn(), mutateAsync: mockCreateMutateAsync, isPending: false };

const mockToast = vi.fn();

vi.mock('./use-cards', () => ({
  useUpdateCard: () => mockMutateObj,
  useDeleteCard: () => mockDeleteMutateObj,
  useCreateCard: () => mockCreateMutateObj,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
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

  describe('Card menu and deletion', () => {
    it('shows card menu trigger button', () => {
      renderWithProviders(<Card card={mockCard} index={0} />);
      const menuButton = screen.getByRole('button', { name: /card menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('calls delete mutation when confirming delete', async () => {
      const user = userEvent.setup();
      mockDeleteMutate.mockImplementation((id, opts) => {
        opts?.onSuccess?.();
      });

      renderWithProviders(<Card card={mockCard} index={0} />);

      const card = screen.getByText('Test Card').closest('div')!;
      await user.hover(card);

      const menuButton = screen.getByRole('button', { name: /card menu/i });
      await user.click(menuButton);

      const deleteItem = await screen.findByRole('menuitem', { name: /delete/i });
      await user.click(deleteItem);

      const confirmBtn = await screen.findByRole('button', { name: /^delete$/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalledWith(
          mockCard.id,
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    describe('Card deletion undo', () => {
      it('shows undo action in toast after successful delete', async () => {
        const user = userEvent.setup();
        mockDeleteMutate.mockImplementation((id, opts) => {
          opts?.onSuccess?.();
        });

        renderWithProviders(<Card card={mockCard} index={0} />);

        const card = screen.getByText('Test Card').closest('div')!;
        await user.hover(card);

        const menuButton = screen.getByRole('button', { name: /card menu/i });
        await user.click(menuButton);

        const deleteItem = await screen.findByRole('menuitem', { name: /delete/i });
        await user.click(deleteItem);

        const confirmBtn = await screen.findByRole('button', { name: /^delete$/i });
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Card deleted',
              type: 'destructive',
              action: expect.objectContaining({
                label: 'Undo',
              }),
            })
          );
        });
      });

      it('clicking Undo in toast calls createCardMutation with card data', async () => {
        const user = userEvent.setup();
        let undoAction: (() => void) | undefined;

        mockDeleteMutate.mockImplementation((id, opts) => {
          opts?.onSuccess?.();
        });

        mockToast.mockImplementation((args) => {
          if (args.action?.onClick) {
            undoAction = args.action.onClick;
          }
        });

        mockCreateMutateAsync.mockResolvedValue({ data: { ...mockCard, id: 2 } });

        renderWithProviders(<Card card={mockCard} index={0} />);

        const card = screen.getByText('Test Card').closest('div')!;
        await user.hover(card);

        const menuButton = screen.getByRole('button', { name: /card menu/i });
        await user.click(menuButton);

        const deleteItem = await screen.findByRole('menuitem', { name: /delete/i });
        await user.click(deleteItem);

        const confirmBtn = await screen.findByRole('button', { name: /^delete$/i });
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(undoAction).toBeDefined();
        });

        await undoAction!();

        await waitFor(() => {
          expect(mockCreateMutateAsync).toHaveBeenCalledWith({
            title: mockCard.title,
            column_id: mockCard.column_id,
            position: mockCard.position,
          });
        });

        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Card restored to original position', type: 'success' })
        );
      });

      it('shows error toast when delete fails', async () => {
        const user = userEvent.setup();
        mockDeleteMutate.mockImplementation((id, opts) => {
          opts?.onError?.(new Error('Delete failed'));
        });

        renderWithProviders(<Card card={mockCard} index={0} />);

        const card = screen.getByText('Test Card').closest('div')!;
        await user.hover(card);

        const menuButton = screen.getByRole('button', { name: /card menu/i });
        await user.click(menuButton);

        const deleteItem = await screen.findByRole('menuitem', { name: /delete/i });
        await user.click(deleteItem);

        const confirmBtn = await screen.findByRole('button', { name: /^delete$/i });
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Failed to delete card', type: 'error' })
          );
        });
      });

      it('shows error toast when undo fails', async () => {
        const user = userEvent.setup();
        let undoAction: (() => void) | undefined;

        mockDeleteMutate.mockImplementation((id, opts) => {
          opts?.onSuccess?.();
        });

        mockToast.mockImplementation((args) => {
          if (args.action?.onClick) {
            undoAction = args.action.onClick;
          }
        });

        mockCreateMutateAsync.mockRejectedValue(new Error('Create failed'));

        renderWithProviders(<Card card={mockCard} index={0} />);

        const card = screen.getByText('Test Card').closest('div')!;
        await user.hover(card);

        const menuButton = screen.getByRole('button', { name: /card menu/i });
        await user.click(menuButton);

        const deleteItem = await screen.findByRole('menuitem', { name: /delete/i });
        await user.click(deleteItem);

        const confirmBtn = await screen.findByRole('button', { name: /^delete$/i });
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(undoAction).toBeDefined();
        });

        await undoAction!();

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Failed to restore card', type: 'error' })
          );
        });
      });
    });
  });
});