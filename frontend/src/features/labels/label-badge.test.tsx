import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LabelBadge } from './label-badge';

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
    color: '#ff0000',
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

  it('applies label color as background', () => {
    renderWithProviders(<LabelBadge label={mockLabel} />);
    const badge = screen.getByText('Bug');
    expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
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
});
