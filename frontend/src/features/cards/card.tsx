import { useState, useRef, useEffect } from 'react';
import { useUpdateCard } from './use-cards';

interface CardProps {
  card: {
    id: number;
    title: string;
    column_id?: number;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  isNew?: boolean;
}

export function Card({ card, isNew }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.title);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateCard = useUpdateCard();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(card.title);
    setError(null);
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditValue(card.title);
      setIsEditing(false);
      return;
    }
    if (trimmed !== card.title) {
      setIsSaving(true);
      setError(null);
      setEditValue(trimmed);
      updateCard.mutate(
        { id: card.id, data: { title: trimmed } },
        {
          onSuccess: () => {
            setIsSaving(false);
            setIsEditing(false);
          },
          onError: () => {
            setIsSaving(false);
            setError('Failed to save');
            setEditValue(card.title);
            setIsEditing(true);
          },
        }
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(card.title);
    setError(null);
    setIsEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Edit card title"
      className={`rounded bg-card p-3 text-sm shadow-sm hover:bg-accent/50 cursor-pointer ${isNew ? 'animate-slide-up' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {isEditing || isSaving ? (
        <input
          ref={inputRef}
          type="text"
          value={isSaving ? editValue : editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          maxLength={500}
          aria-label="Card title"
          disabled={isSaving}
          className="w-full bg-transparent outline-none border-b border-primary disabled:opacity-50"
        />
      ) : (
        <span className="block">{card.title}</span>
      )}
    </div>
  );
}