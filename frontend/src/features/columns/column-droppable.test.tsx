import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ColumnDroppable } from './column-droppable';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('ColumnDroppable', () => {
  it('renders drop zone container', () => {
    renderWithProviders(
      <ColumnDroppable columnId={1}>
        {({ isOver, setNodeRef }) => (
          <div ref={setNodeRef} data-testid="drop-zone">
            {isOver ? 'Drop target' : 'Normal'}
          </div>
        )}
      </ColumnDroppable>
    );
    expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
  });

  it('renders children', () => {
    renderWithProviders(
      <ColumnDroppable columnId={1}>
        {() => <span>Column content</span>}
      </ColumnDroppable>
    );
    expect(screen.getByText('Column content')).toBeInTheDocument();
  });
});