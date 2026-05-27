import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LabelBadge } from './label-badge';
import { LABEL_COLOR_CLASS_MAP } from './label-colors';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('LabelBadge', () => {
  const mockLabel = {
    id: 1,
    name: 'Bug',
    color: 'red',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders label name', () => {
    renderWithProviders(<LabelBadge label={mockLabel} />);
    expect(screen.getByText('Bug')).toBeInTheDocument();
  });

  it('applies label color class', () => {
    renderWithProviders(<LabelBadge label={mockLabel} />);
    const badge = screen.getByText('Bug');
    expect(badge.className).toContain(LABEL_COLOR_CLASS_MAP.red);
  });

  it('has title attribute with label name', () => {
    renderWithProviders(<LabelBadge label={mockLabel} />);
    const badge = screen.getByText('Bug');
    expect(badge).toHaveAttribute('title', 'Bug');
  });

  it('applies custom className', () => {
    renderWithProviders(<LabelBadge label={mockLabel} className="custom-class" />);
    const badge = screen.getByText('Bug');
    expect(badge.className).toContain('custom-class');
  });

  it('renders remove button when onRemove is provided', () => {
    const onRemove = vi.fn();
    renderWithProviders(<LabelBadge label={mockLabel} onRemove={onRemove} />);
    const removeBtn = screen.getByRole('button', { name: /remove bug/i });
    expect(removeBtn).toBeInTheDocument();
  });

  it('does not render remove button when onRemove is not provided', () => {
    renderWithProviders(<LabelBadge label={mockLabel} />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});
