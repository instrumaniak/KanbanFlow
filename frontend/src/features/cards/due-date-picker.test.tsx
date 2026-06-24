import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DueDatePicker } from './due-date-picker';

describe('DueDatePicker', () => {
  const onDateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "No due date" when dueDate is null', () => {
    render(<DueDatePicker dueDate={null} onDateChange={onDateChange} />);

    expect(screen.getByText('No due date')).toBeInTheDocument();
    expect(screen.getByLabelText('Set due date')).toBeInTheDocument();
  });

  it('renders formatted date when dueDate is set', () => {
    render(<DueDatePicker dueDate="2026-07-20T00:00:00.000Z" onDateChange={onDateChange} />);

    expect(screen.getByText('Jul 20, 2026')).toBeInTheDocument();
  });

  it('renders "Today" when due date is today', () => {
    const fixedDate = new Date('2026-06-15T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    render(<DueDatePicker dueDate="2026-06-15T00:00:00.000Z" onDateChange={onDateChange} />);

    expect(screen.getByText('Today')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows clear button when due date is set', () => {
    render(<DueDatePicker dueDate="2026-06-15T00:00:00.000Z" onDateChange={onDateChange} />);

    expect(screen.getByLabelText('Clear due date')).toBeInTheDocument();
  });

  it('hides clear button when dueDate is null', () => {
    render(<DueDatePicker dueDate={null} onDateChange={onDateChange} />);

    expect(screen.queryByLabelText('Clear due date')).not.toBeInTheDocument();
  });

  it('calls onDateChange(null) when clear button is clicked', () => {
    render(<DueDatePicker dueDate="2026-06-15T00:00:00.000Z" onDateChange={onDateChange} />);

    fireEvent.click(screen.getByLabelText('Clear due date'));

    expect(onDateChange).toHaveBeenCalledWith(null);
  });

  it('opens calendar popover on trigger click', () => {
    render(<DueDatePicker dueDate={null} onDateChange={onDateChange} />);

    fireEvent.click(screen.getByLabelText('Set due date'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('disables trigger button when disabled prop is true', () => {
    render(<DueDatePicker dueDate={null} onDateChange={onDateChange} disabled />);

    expect(screen.getByLabelText('Set due date')).toBeDisabled();
  });

  it('disables clear button when disabled prop is true', () => {
    render(<DueDatePicker dueDate="2026-06-15T00:00:00.000Z" onDateChange={onDateChange} disabled />);

    expect(screen.getByLabelText('Clear due date')).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<DueDatePicker dueDate="2026-06-15T00:00:00.000Z" onDateChange={onDateChange} />);

    const trigger = screen.getByLabelText('Set due date');
    expect(trigger).toHaveAttribute('aria-label', 'Set due date');

    const clearButton = screen.getByLabelText('Clear due date');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear due date');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DueDatePicker dueDate={null} onDateChange={onDateChange} />);

    const trigger = screen.getByLabelText('Set due date');
    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not show due date badge for invalid date string', () => {
    render(<DueDatePicker dueDate="invalid-date" onDateChange={onDateChange} />);

    expect(screen.getByText('No due date')).toBeInTheDocument();
  });
});
