import { isPast, isToday, format } from 'date-fns';

export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface DueDateBadge {
  text: string;
  className: string;
}

export function getDueDateBadge(dueDate: string | null): DueDateBadge | null {
  if (!dueDate) return null;

  const date = parseDate(dueDate);
  if (!date) return null;

  if (isToday(date)) {
    return {
      text: 'Today',
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    };
  }

  if (isPast(date)) {
    return {
      text: format(date, 'MMM d, yyyy'),
      className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    };
  }

  return {
    text: format(date, 'MMM d, yyyy'),
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
}

export function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const date = parseDate(dueDate);
  if (!date) return null;

  return isToday(date) ? 'Today' : format(date, 'MMM d, yyyy');
}
