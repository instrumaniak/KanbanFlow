import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from './breadcrumbs';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumbs', () => {
  it('renders project and board names', () => {
    renderWithRouter(
      <Breadcrumbs
        projectName="My Project"
        boardName="Sprint Board"
        projectId="1"
        boardId="2"
      />,
    );

    expect(screen.getByText('Project: My Project')).toBeInTheDocument();
    expect(screen.getByText('Board: Sprint Board')).toBeInTheDocument();
  });

  it('current location (board) is not a link', () => {
    renderWithRouter(
      <Breadcrumbs
        projectName="My Project"
        boardName="Sprint Board"
        projectId="1"
        boardId="2"
      />,
    );

    const boardCrumb = screen.getByText('Board: Sprint Board');
    expect(boardCrumb.tagName).toBe('SPAN');
  });

  it('project crumb is a link when board is present', () => {
    renderWithRouter(
      <Breadcrumbs
        projectName="My Project"
        boardName="Sprint Board"
        projectId="1"
        boardId="2"
      />,
    );

    const projectLink = screen.getByText('Project: My Project');
    expect(projectLink.closest('a')).toHaveAttribute(
      'href',
      '/projects/1',
    );
  });

  it('project crumb is text (not link) when no board is shown', () => {
    renderWithRouter(<Breadcrumbs projectName="My Project" projectId="1" />);

    const projectCrumb = screen.getByText('Project: My Project');
    expect(projectCrumb.tagName).toBe('SPAN');
  });

  it('is hidden when no project context', () => {
    const { container } = renderWithRouter(<Breadcrumbs />);

    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('uses semantic nav with Breadcrumb aria-label', () => {
    renderWithRouter(
      <Breadcrumbs projectName="My Project" projectId="1" />,
    );

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Breadcrumb',
    );
  });
});
