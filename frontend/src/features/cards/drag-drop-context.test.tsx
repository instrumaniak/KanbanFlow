import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DragDropContext } from './drag-drop-context';

vi.mock('./use-cards', () => ({
  useMoveCard: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useReorderCard: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('DragDropContext', () => {
  it('renders children', () => {
    renderWithProviders(
      <DragDropContext>
        <div data-testid="children">Drag content</div>
      </DragDropContext>
    );
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });
});