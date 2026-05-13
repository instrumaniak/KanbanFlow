import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreateBoardModal } from './create-board-modal';
import { ToastProvider } from '@/components/ui/toast-provider';

vi.mock('./use-boards', () => ({
  useCreateBoard: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Test Board', background_color: '#0079BF' } }),
    isPending: false,
  }),
}));

vi.mock('../projects/use-projects', () => ({
  useProjects: () => ({
    data: {
      data: [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
      ],
    },
  }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  );
};

describe('CreateBoardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with form fields', () => {
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create new board')).toBeInTheDocument();
    expect(screen.getByLabelText(/Board name/i)).toBeInTheDocument();
    expect(screen.getByText('Project (optional)')).toBeInTheDocument();
  });

  it('shows Cancel and Create Board buttons', () => {
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Board/i })).toBeInTheDocument();
  });

  it('resets form when opened', () => {
    const onOpenChange = vi.fn();
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByLabelText(/Board name/i);
    expect(input).toHaveValue('');
  });

  it('calls onOpenChange when Cancel is clicked', () => {
    const onOpenChange = vi.fn();
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows Create Board button disabled when name is empty', () => {
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: /Create Board/i });
    expect(createButton).toBeDisabled();
  });

  it('enables Create Board button when name has content', () => {
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={vi.fn()} />);

    const input = screen.getByLabelText(/Board name/i);
    fireEvent.change(input, { target: { value: 'My Board' } });

    const createButton = screen.getByRole('button', { name: /Create Board/i });
    expect(createButton).toBeEnabled();
  });

  it('renders project dropdown with options', () => {
    renderWithRouter(<CreateBoardModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('No project')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });
});
