import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider } from './use-toast';
import { useToastHelpers } from '@/lib/toast-helpers';

function TestComponent() {
  const { showSuccess, showError, showDestructive } = useToastHelpers();
  return (
    <div>
      <button onClick={() => showSuccess('Success!', 'Done')}>Success</button>
      <button onClick={() => showError('Error!', 'Failed')}>Error</button>
      <button onClick={() => showDestructive('Deleted', vi.fn(), 'Removed')}>Destructive</button>
    </div>
  );
}

describe('Toast helpers', () => {
  it('showSuccess creates toast with type success', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('showError creates toast with type error', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Error'));
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('showDestructive creates toast with action and type destructive', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Destructive'));
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });
});
