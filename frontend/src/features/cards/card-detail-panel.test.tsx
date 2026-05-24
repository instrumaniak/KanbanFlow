import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CardDetailPanel } from './card-detail-panel';

const mockMutate = vi.fn();
const mockMutateObj = {
  mutate: mockMutate,
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockToast = vi.fn();

vi.mock('./use-cards', () => ({
  useUpdateCard: () => mockMutateObj,
  useAssignCardLabel: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveCardLabel: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../labels/use-labels', () => ({
  useLabels: () => ({ data: [], isLoading: false }),
  useCreateLabel: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
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

describe('CardDetailPanel', () => {
  const mockCard = {
    id: 1,
    title: 'Test Card',
    column_id: 1,
    position: 0,
    description: 'A description',
    due_date: '2026-06-15T00:00:00.000Z',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockCardNoExtras = {
    id: 2,
    title: 'Simple Card',
    column_id: 1,
    position: 1,
    description: null,
    due_date: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders card title in input', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument();
  });

  it('renders description textarea with card description', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByDisplayValue('A description')).toBeInTheDocument();
  });

  it('shows formatted due date when set', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText(/Jun 15, 2026/)).toBeInTheDocument();
  });

  it('shows no due date placeholder when due_date is null', () => {
    renderWithProviders(<CardDetailPanel card={mockCardNoExtras} open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('shows labels section', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Add labels')).toBeInTheDocument();
  });

  it('shows checklist placeholder', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Checklists will be available in a future update.')).toBeInTheDocument();
  });

  it('saves title on blur when changed', async () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

    const titleInput = screen.getByLabelText('Card title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Title');
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 1, data: { title: 'Updated Title' } },
        expect.objectContaining({ onSettled: expect.any(Function) }),
      );
    });
  });

  it('does not save title on blur when unchanged', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

    const titleInput = screen.getByLabelText('Card title');
    fireEvent.blur(titleInput);

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('reverts title to original when emptied and blurred', () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

    const titleInput = screen.getByLabelText('Card title') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.blur(titleInput);

    expect(titleInput.value).toBe('Test Card');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('saves description on blur when changed', async () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

    const textarea = screen.getByLabelText('Card description');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'New description');
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 1, data: { description: 'New description' } },
        expect.objectContaining({ onSettled: expect.any(Function) }),
      );
    });
  });

  it('saves null description when cleared and blurred', async () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

    const textarea = screen.getByLabelText('Card description');
    await userEvent.clear(textarea);
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 1, data: { description: null } },
        expect.objectContaining({ onSettled: expect.any(Function) }),
      );
    });
  });

  it('shows saving indicator during title mutation', async () => {
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

    const titleInput = screen.getByLabelText('Card title');
    await userEvent.type(titleInput, 'Updated Title');
    fireEvent.blur(titleInput);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('updates local state when card prop changes', () => {
    const { rerender } = renderWithProviders(
      <CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CardDetailPanel card={{ ...mockCard, title: 'New Title' }} open={true} onOpenChange={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
  });

  it('calls onOpenChange when dialog is dismissed', async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={onOpenChange} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  describe('Markdown description editor', () => {
    it('defaults to Edit tab with textarea visible', () => {
      renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByRole('tab', { name: /edit/i })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: /preview/i })).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByLabelText('Card description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A description')).toBeInTheDocument();
    });

    it('switches to Preview tab and renders markdown', async () => {
      const markdownCard = { ...mockCard, description: '# Hello\n\n- item 1\n- item 2' };
      renderWithProviders(<CardDetailPanel card={markdownCard} open={true} onOpenChange={vi.fn()} />);

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await userEvent.click(previewTab);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');
      });
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('switches back to Edit tab and preserves textarea content', async () => {
      renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await userEvent.click(previewTab);
      await waitFor(() => {
        expect(screen.queryByLabelText('Card description')).not.toBeInTheDocument();
      });

      const editTab = screen.getByRole('tab', { name: /edit/i });
      await userEvent.click(editTab);

      expect(screen.getByLabelText('Card description')).toHaveValue('A description');
    });

    it('auto-saves raw markdown on blur in Edit mode', async () => {
      renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

      const textarea = screen.getByLabelText('Card description');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, '# Updated');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          { id: 1, data: { description: '# Updated' } },
          expect.objectContaining({ onSettled: expect.any(Function) }),
        );
      });
    });

    it('shows "Nothing to preview" when description is empty in Preview mode', async () => {
      const emptyCard = { ...mockCard, description: '' };
      renderWithProviders(<CardDetailPanel card={emptyCard} open={true} onOpenChange={vi.fn()} />);

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await userEvent.click(previewTab);

      await waitFor(() => {
        expect(screen.getByText('Nothing to preview')).toBeInTheDocument();
      });
    });

    it('sanitizes XSS payload in Preview mode', async () => {
      const xssCard = { ...mockCard, description: '<script>alert("xss")</script>\n\n[link](javascript:alert(1))' };
      renderWithProviders(<CardDetailPanel card={xssCard} open={true} onOpenChange={vi.fn()} />);

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await userEvent.click(previewTab);

      await waitFor(() => {
        expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
      });

      const previewPanel = screen.getByRole('tabpanel');
      const html = previewPanel.innerHTML;
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('javascript:');
    });

    it('sanitizes dangerous HTML tags in Preview mode', async () => {
      const payload = '<img src=x onerror=alert(1)>\n\n<iframe src="javascript:alert(1)">\n\n<svg onload=alert(1)>';
      const xssCard = { ...mockCard, description: payload };
      renderWithProviders(<CardDetailPanel card={xssCard} open={true} onOpenChange={vi.fn()} />);

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await userEvent.click(previewTab);

      const previewPanel = screen.getByRole('tabpanel');
      const html = previewPanel.innerHTML;
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('<svg');
    });

    it('has accessible tab list with aria-label', () => {
      renderWithProviders(<CardDetailPanel card={mockCard} open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByLabelText('Description mode')).toBeInTheDocument();
    });
  });
});
