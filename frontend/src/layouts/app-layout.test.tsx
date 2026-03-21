import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from './app-layout';

// Mock window.matchMedia for jsdom
function setupMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

const mockLogout = vi.fn();
vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', role: 'user' },
    isLoading: false,
    logout: mockLogout,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

// Mock Outlet to render child content
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setupMatchMedia();
  });

  it('renders header with app name', () => {
    renderWithRouter(<AppLayout />);

    expect(screen.getByText('KanbanFlow')).toBeInTheDocument();
  });

  it('renders sidebar toggle button', () => {
    renderWithRouter(<AppLayout />);

    const toggleButtons = screen.getAllByLabelText('Toggle sidebar');
    // One in header (mobile), one in sidebar
    expect(toggleButtons.length).toBe(2);
  });

  it('sidebar is collapsed by default', () => {
    renderWithRouter(<AppLayout />);

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-0');
  });

  it('toggle expands/collapses sidebar', () => {
    renderWithRouter(<AppLayout />);

    // Use the sidebar's toggle button (inside the aside)
    const aside = screen.getByRole('complementary');
    const sidebarToggle = within(aside).getByLabelText('Toggle sidebar');

    expect(aside).toHaveClass('w-0');

    fireEvent.click(sidebarToggle);
    expect(aside).toHaveClass('w-[240px]');

    fireEvent.click(sidebarToggle);
    expect(aside).toHaveClass('w-0');
  });

  it('collapsed state persists to localStorage', () => {
    renderWithRouter(<AppLayout />);

    const aside = screen.getByRole('complementary');
    const sidebarToggle = within(aside).getByLabelText('Toggle sidebar');

    // Expand sidebar
    fireEvent.click(sidebarToggle);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('false');

    // Collapse sidebar
    fireEvent.click(sidebarToggle);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('renders user email in header', () => {
    renderWithRouter(<AppLayout />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderWithRouter(<AppLayout />);

    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });

  it('renders Outlet for nested routes', () => {
    renderWithRouter(<AppLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
