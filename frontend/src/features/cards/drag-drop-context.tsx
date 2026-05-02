import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMoveCard, type Card } from './use-cards';
import type { DragData } from './use-cards';
import { useToast } from '@/components/ui/use-toast';

export function DragDropContext({ children }: { children: React.ReactNode }) {
  const moveCardMutation = useMoveCard();
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current as DragData;
    if (activeData?.card) {
      setActiveCard(activeData.card);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      return;
    }

    const activeData = active.data.current as DragData | undefined;
    if (!activeData) return;
    
    const targetColumnId = over.id as number;
    const cardId = active.id as number;

    if (activeData.sourceColumnId === targetColumnId) {
      return;
    }

    try {
      await moveCardMutation.mutateAsync({
        id: cardId,
        data: { column_id: targetColumnId },
      });
      toast({ title: 'Card moved', type: 'success' });
    } catch (err) {
      toast({
        title: 'Failed to move card',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    }
  }, [moveCardMutation, toast]);

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      {createPortal(
        <DragOverlay>
          {activeCard ? (
            <div
              style={{
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            >
              <div className="rounded bg-card p-3 text-sm shadow-lg scale-[1.02]">
                {activeCard.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}