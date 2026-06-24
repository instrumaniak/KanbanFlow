import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { parseDate, formatDueDate } from './date-utils';

interface DueDatePickerProps {
  dueDate: string | null;
  onDateChange: (date: string | null) => void;
  disabled?: boolean;
}

export function DueDatePicker({ dueDate, onDateChange, disabled }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(dueDate);
  const displayText = formatDueDate(dueDate);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs justify-start"
            disabled={disabled}
            aria-label="Set due date"
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {displayText ?? 'No due date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(date) => {
              onDateChange(date ? date.toISOString() : null);
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {dueDate && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onDateChange(null)}
          disabled={disabled}
          aria-label="Clear due date"
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
