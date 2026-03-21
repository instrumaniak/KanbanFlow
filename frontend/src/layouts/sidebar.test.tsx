import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  const mockProjects = [
    { id: '1', name: 'Project Alpha' },
    { id: '2', name: 'Project Beta' },
  ];

  const defaultProps = {
    collapsed: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list items', () => {
    render(<Sidebar {...defaultProps} projects={mockProjects} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('shows "No projects yet" when projects array is empty', () => {
    render(<Sidebar {...defaultProps} projects={[]} />);

    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  it('highlights active project', () => {
    render(
      <Sidebar {...defaultProps} projects={mockProjects} activeProjectId="1" />,
    );

    const activeButton = screen.getByText('Project Alpha').closest('button');
    expect(activeButton).toHaveClass('bg-sidebar-accent');
  });

  it('calls onProjectClick when project is clicked', () => {
    const onProjectClick = vi.fn();
    render(
      <Sidebar
        {...defaultProps}
        projects={mockProjects}
        onProjectClick={onProjectClick}
      />,
    );

    fireEvent.click(screen.getByText('Project Alpha'));
    expect(onProjectClick).toHaveBeenCalledWith('1');
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(<Sidebar collapsed={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByLabelText('Toggle sidebar'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is collapsed when collapsed prop is true', () => {
    render(<Sidebar collapsed={true} onToggle={vi.fn()} />);

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-0');
  });

  it('is expanded when collapsed prop is false', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-[240px]');
  });

  it('toggle button is accessible via keyboard', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);

    const toggleButton = screen.getByLabelText('Toggle sidebar');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle sidebar');
  });
});
