import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ChecklistSection } from './checklist-section';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
};

describe('ChecklistSection', () => {
  const checklist = {
    id: 11,
    title: 'Release checklist',
    card_id: 7,
    items: [
      {
        id: 21,
        text: 'Write tests',
        is_completed: true,
        checklist_id: 11,
        position: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 22,
        text: 'Ship frontend',
        is_completed: false,
        checklist_id: 11,
        position: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('renders checklist data from the api response shape', () => {
    renderWithProviders(<ChecklistSection cardId={7} checklists={[checklist]} />);

    expect(screen.getByText('Release checklist')).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Ship frontend')).toBeInTheDocument();
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
  });

  it('renders add checklist button when populated and when empty', () => {
    const { rerender } = renderWithProviders(<ChecklistSection cardId={7} checklists={[]} />);

    expect(screen.getByRole('button', { name: /\+ Add Checklist/i })).toBeInTheDocument();
    expect(screen.getByText('No checklists yet')).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <ChecklistSection cardId={7} checklists={[checklist]} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('button', { name: /\+ Add Checklist/i })).toBeInTheDocument();
    expect(screen.getByText('Release checklist')).toBeInTheDocument();
  });
});
