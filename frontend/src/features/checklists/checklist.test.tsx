import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast-provider';
import { Checklist } from './checklist';

const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
};

describe('Checklist', () => {
  const mockChecklist = {
    id: 1,
    title: 'My Checklist',
    card_id: 1,
    items: [
      {
        id: 1,
        text: 'Item 1',
        is_completed: true,
        checklist_id: 1,
        position: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 2,
        text: 'Item 2',
        is_completed: false,
        checklist_id: 1,
        position: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checklist title', () => {
    const Wrapper = createQueryClientWrapper();
    render(
      <Wrapper>
        <Checklist checklist={mockChecklist} />
      </Wrapper>,
    );

    expect(screen.getByText('My Checklist')).toBeInTheDocument();
  });

  it('displays correct progress counts', () => {
    const Wrapper = createQueryClientWrapper();
    render(
      <Wrapper>
        <Checklist checklist={mockChecklist} />
      </Wrapper>,
    );

    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
  });

  it('shows 0/0 (0%) for empty checklist', () => {
    const emptyChecklist = { ...mockChecklist, items: [] };
    const Wrapper = createQueryClientWrapper();
    render(
      <Wrapper>
        <Checklist checklist={emptyChecklist} />
      </Wrapper>,
    );

    expect(screen.getByText('0/0 (0%)')).toBeInTheDocument();
  });

  it('renders checklist items', () => {
    const Wrapper = createQueryClientWrapper();
    render(
      <Wrapper>
        <Checklist checklist={mockChecklist} />
      </Wrapper>,
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('shows add item button', () => {
    const Wrapper = createQueryClientWrapper();
    render(
      <Wrapper>
        <Checklist checklist={mockChecklist} />
      </Wrapper>,
    );

    expect(screen.getByText('+ Add item')).toBeInTheDocument();
  });

  it('shows delete button', () => {
    const Wrapper = createQueryClientWrapper();
    render(
      <Wrapper>
        <Checklist checklist={mockChecklist} />
      </Wrapper>,
    );

    expect(screen.getByText('Delete checklist')).toBeInTheDocument();
  });
});
