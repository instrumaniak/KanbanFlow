import { useState, useRef, useEffect, type KeyboardEvent, type FocusEvent } from 'react';
import { useCreateCard, type Card } from './use-cards';

interface AddCardInputProps {
  columnId: number;
  nextColumnId?: number;
  onCardCreated?: (card: Card) => void;
}

export function AddCardInput({ columnId, nextColumnId, onCardCreated }: AddCardInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const createCard = useCreateCard();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const openInput = () => setIsOpen(true);

  const closeInput = () => {
    setIsOpen(false);
    setTitle('');
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (title.trim()) {
        try {
          const result = await createCard.mutateAsync({
            title: title.trim(),
            column_id: columnId,
          });
          onCardCreated?.(result.data);
          setTitle('');
          inputRef.current?.focus();
        } catch {
          // Error handled by React Query
        }
      } else {
        closeInput();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeInput();
    } else if (e.key === 'Tab' && nextColumnId) {
      e.preventDefault();
      if (title.trim()) {
        try {
          await createCard.mutateAsync({
            title: title.trim(),
            column_id: columnId,
          });
        } catch {
          // Error handled by React Query
        }
      }
      const selector = `[data-column-id="${nextColumnId}"] textarea`;
      const nextInput = document.querySelector(selector) as HTMLTextAreaElement | null;
      if (nextInput) {
        nextInput.focus();
      } else {
        closeInput();
      }
    }
  };

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget?.closest(`[data-column-id="${columnId}"]`)) {
      if (!title.trim()) {
        closeInput();
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openInput}
        className="flex w-full items-center rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
      >
        + Add a card
      </button>
    );
  }

  return (
    <div className="animate-slide-up">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Enter a title..."
        rows={1}
        className="w-full resize-none rounded bg-card p-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
        style={{ minHeight: '2.5rem', height: 'auto' }}
        data-column-id={columnId}
      />
    </div>
  );
}