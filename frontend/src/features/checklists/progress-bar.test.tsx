import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('renders an empty bar at 0/0 without division errors', () => {
    render(<ProgressBar completed={0} total={0} />);

    const bar = screen.getByLabelText('Checklist progress: 0/0 (0%)');
    expect(bar).toHaveAttribute('data-progress-state', 'empty');
  });

  it('renders a partial teal bar', () => {
    render(<ProgressBar completed={1} total={2} />);

    const bar = screen.getByLabelText('Checklist progress: 1/2 (50%)');
    expect(bar).toHaveAttribute('data-progress-state', 'partial');
    expect(bar.querySelector('div')).toHaveClass('bg-teal-500');
  });

  it('renders a complete green bar with a checkmark', () => {
    render(<ProgressBar completed={2} total={2} />);

    const bar = screen.getByLabelText('Checklist progress: 2/2 (100%)');
    expect(bar).toHaveAttribute('data-progress-state', 'complete');
    expect(bar.querySelector('div')).toHaveClass('bg-emerald-500');
    expect(bar.querySelector('svg')).toBeInTheDocument();
  });
});
