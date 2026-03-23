import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders icon, headline, and description', () => {
    render(
      <EmptyState
        icon={<span data-testid="icon">Icon</span>}
        headline="No items found"
        description="Create something to get started"
      />,
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No items found' })).toBeInTheDocument();
    expect(screen.getByText('Create something to get started')).toBeInTheDocument();
  });

  it('renders CTA button with correct label and fires callback', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={<span>Icon</span>}
        headline="Empty"
        action={{ label: 'Create item', onClick }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Create item' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render button when no action provided', () => {
    render(<EmptyState icon={<span>Icon</span>} headline="Empty" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders correctly in dark mode with CSS variables', () => {
    const { container } = render(
      <EmptyState icon={<span>Icon</span>} headline="Test" />,
    );
    const wrapper = container.querySelector('.bg-muted');
    expect(wrapper).toBeInTheDocument();
  });
});
