import { useState, useRef, useEffect } from 'react';
import { useUpdateCard, type Card as CardType } from './use-cards';
import { CardDraggable } from './card-draggable';

interface CardProps {
  card: CardType;
  index: number;
  isNew?: boolean;
}

export function Card({ card, index, isNew }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const updateCard = useUpdateCard();

  const isDragDisabled = isEditing || isSaving;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      pointerDownPos.current = null;
      if (distance > 5) return;
    }
    e.stopPropagation();
    setEditValue(card.title);
    setIsEditing(true);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      setEditValue(card.title);
      setIsEditing(true);
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
    setIsEditing(false);
  };

  return (
    <CardDraggable card={card} index={index} isDragDisabled={isDragDisabled}>
      {({ isDragging }) => (
        <div
          role="button"
          tabIndex={0}
          aria-label="Edit card title"
          className={`rounded bg-card p-3 text-sm shadow-sm hover:bg-accent/50 cursor-pointer ${isNew ? 'animate-slide-up' : ''} ${isDragging ? 'shadow-lg scale-[1.02]' : ''}`}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
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
      )}
    </CardDraggable>
  );
}