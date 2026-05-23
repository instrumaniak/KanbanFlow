import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LabelPicker } from './label-picker';

const mockAssignMutate = vi.fn();
const mockRemoveMutate = vi.fn();

const mockLabels = [
  { id: 1, name: 'Bug', color: '#ff0000', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, name: 'Feature', color: '#00ff00', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 3, name: 'Enhancement', color: '#0000ff', created_at: '2024-01-01', updated_at: '2024-01-01' },
];

vi.mock('../labels/use-labels', () => ({
  useLabels: () => ({ data: mockLabels, isLoading: false }),
}));

vi.mock('../cards/use-cards', () => ({
  useAssignCardLabel: () => ({ mutate: mockAssignMutate, isPending: false }),
  useRemoveCardLabel: () => ({ mutate: mockRemoveMutate, isPending: false }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
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

describe('LabelPicker', () => {
  const mockCard = {
    id: 1,
    title: 'Test Card',
    column_id: 1,
    position: 0,
    description: null,
    due_date: null,
    labels: [mockLabels[0]],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockCardNoLabels = {
    ...mockCard,
    labels: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all available labels', () => {
    renderWithProviders(<LabelPicker card={mockCard} />);
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Enhancement')).toBeInTheDocument();
  });

  it('shows assigned label with higher opacity', () => {
    renderWithProviders(<LabelPicker card={mockCard} />);
    const bugButton = screen.getByText('Bug');
    expect(bugButton.className).toContain('opacity-100');
  });

  it('shows unassigned labels with lower opacity', () => {
    renderWithProviders(<LabelPicker card={mockCard} />);
    const featureButton = screen.getByText('Feature');
    expect(featureButton.className).toContain('opacity-50');
  });

  it('calls assign mutation when clicking unassigned label', async () => {
    renderWithProviders(<LabelPicker card={mockCardNoLabels} />);
    const featureButton = screen.getByText('Feature');
    await userEvent.click(featureButton);

    await waitFor(() => {
      expect(mockAssignMutate).toHaveBeenCalledWith(
        { cardId: 1, labelId: 2 },
        expect.any(Object),
      );
    });
  });

  it('calls remove mutation when clicking assigned label', async () => {
    renderWithProviders(<LabelPicker card={mockCard} />);
    const bugButton = screen.getByText('Bug');
    await userEvent.click(bugButton);

    await waitFor(() => {
      expect(mockRemoveMutate).toHaveBeenCalledWith(
        { cardId: 1, labelId: 1 },
        expect.any(Object),
      );
    });
  });

  it('displays labels with correct background colors', () => {
    renderWithProviders(<LabelPicker card={mockCard} />);
    const bugButton = screen.getByText('Bug');
    expect(bugButton).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('has title attribute for accessibility', () => {
    renderWithProviders(<LabelPicker card={mockCard} />);
    const bugButton = screen.getByText('Bug');
    expect(bugButton).toHaveAttribute('title', 'Remove Bug');
  });
});
