import { useDraggable } from '@dnd-kit/core';
import type { DraggableAttributes } from '@dnd-kit/core';
import { type Card } from './use-cards';
import { type DragData } from './drag-drop-context';
import { useState } from 'react';

interface CardDraggableProps {
  card: Card;
  isDragDisabled?: boolean;
  children: (props: {
    isDragging: boolean;
    transform: { x: number; y: number } | null;
    attributes: DraggableAttributes;
    listeners: Record<string, unknown>;
    setNodeRef: (node: HTMLElement | null) => void;
  }) => React.ReactNode;
}

export function CardDraggable({ card, isDragDisabled = false, children }: CardDraggableProps) {
  const [isHovered, setIsHovered] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    data: {
      cardId: card.id,
      sourceColumnId: card.column_id ?? undefined,
    } as DragData,
  });

  const cssTransform = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : undefined;

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: cssTransform,
        opacity: isDragging ? 0.5 : 1,
        transition: isDragging ? 'none' : 'transform 150ms ease-out, box-shadow 150ms ease-out',
        boxShadow: isDragging
          ? '0 10px 20px rgba(0,0,0,0.15)'
          : isHovered
          ? '0 4px 6px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: isDragDisabled ? 'text' : isDragging ? 'grabbing' : isHovered ? 'grab' : 'pointer',
        pointerEvents: isDragDisabled ? 'none' : 'auto',
      }}
      {...(isDragDisabled ? {} : listeners as Record<string, unknown>)}
      {...(isDragDisabled ? {} : attributes)}
    >
      {children({
        isDragging,
        transform,
        attributes,
        listeners: listeners as Record<string, unknown>,
        setNodeRef,
      })}
    </div>
  );
}