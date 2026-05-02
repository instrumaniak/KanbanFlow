import { DndContext, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent, DragStartEvent, DragOverEvent, DropAnimation } from '@dnd-kit/core';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMoveCard, useReorderCard, type Card } from './use-cards';
import type { DragData } from './use-cards';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function DragDropContext({ children }: { children: React.ReactNode }) {
  const moveCardMutation = useMoveCard();
  const reorderCardMutation = useReorderCard();
  const queryClient = useQueryClient();
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
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current as DragData;
    if (activeData?.card) {
      setActiveCard(activeData.card);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as DragData;
    const overData = over.data.current as { card?: Card; columnId?: number; index?: number };

    if (!activeData || !activeData.card) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    const sourceColumnId = activeData.card.column_id;
    let targetColumnId: number | undefined;

    if (overData.columnId !== undefined) {
      targetColumnId = overData.columnId;
    } else if (overData.card?.column_id !== undefined) {
      targetColumnId = overData.card.column_id;
    }

    if (targetColumnId === undefined || sourceColumnId === targetColumnId) return;

    // Moving between columns
    queryClient.setQueryData<Card[]>(['cards', sourceColumnId], (old) => {
      return old?.filter((c) => c.id !== activeId);
    });

    queryClient.setQueryData<Card[]>(['cards', targetColumnId], (old) => {
      const newCards = [...(old || [])];
      const isOverACard = overData.card !== undefined;
      let newIndex: number;

      if (isOverACard) {
        newIndex = newCards.findIndex((c) => c.id === overId);
      } else {
        newIndex = newCards.length;
      }

      const movedCard = { ...activeData.card, column_id: targetColumnId };
      newCards.splice(newIndex, 0, movedCard);

      // Update the active data to reflect the new column for future drag over events
      active.data.current = {
        ...activeData,
        card: movedCard,
      };

      return newCards;
    });
  }, [queryClient]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeData = active.data.current as DragData;
    if (!activeData || !activeData.card) return;

    const cardId = active.id as number;
    const overId = over.id as number;
    
    // 1. Determine final column and position
    const allCardsQueries = queryClient.getQueriesData<Card[]>({ queryKey: ['cards'] });
    let finalColumnId: number | undefined;
    let finalPosition: number | undefined;
    const originalColumnId = activeData.sourceColumnId; // The column it started in

    // Find which column the card is currently in (it might have moved during onDragOver)
    for (const [queryKey, cards] of allCardsQueries) {
      const index = cards?.findIndex((c) => c.id === cardId);
      if (index !== -1 && index !== undefined) {
        finalColumnId = queryKey[1] as number;
        finalPosition = index;
        break;
      }
    }

    if (finalColumnId === undefined || finalPosition === undefined) return;

    // 2. If it's the same column, dnd-kit sortable might have moved it visually but we need the actual new index
    // if onDragOver didn't handle it (which it doesn't for same-column).
    if (originalColumnId === finalColumnId) {
      const cards = queryClient.getQueryData<Card[]>(['cards', finalColumnId]);
      if (cards) {
        const oldIndex = cards.findIndex((c) => c.id === cardId);
        const overData = over.data.current as { card?: Card; index?: number };
        
        let newIndex: number;
        if (overData.card) {
          newIndex = cards.findIndex((c) => c.id === overId);
        } else {
          newIndex = cards.length - 1;
        }

        if (oldIndex !== newIndex) {
          finalPosition = newIndex;
          // Optimistically update the cache for the reorder
          queryClient.setQueryData<Card[]>(['cards', finalColumnId], (old) => {
            if (!old) return [];
            return arrayMove(old, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }));
          });
        } else {
          // No change in position
          return;
        }
      }
    }

    // 3. Persist the change
    if (originalColumnId === finalColumnId) {
      try {
        await reorderCardMutation.mutateAsync({
          id: cardId,
          position: finalPosition,
        });
        toast({ title: 'Card reordered', type: 'success' });
      } catch (err) {
        toast({ title: 'Failed to reorder card', type: 'error' });
      }
    } else {
      try {
        await moveCardMutation.mutateAsync({
          id: cardId,
          data: { column_id: finalColumnId, position: finalPosition },
        });
        toast({ title: 'Card moved', type: 'success' });
      } catch (err) {
        toast({ title: 'Failed to move card', type: 'error' });
      }
    }
  }, [moveCardMutation, reorderCardMutation, queryClient, toast]);

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    queryClient.invalidateQueries({ queryKey: ['cards'] });
  }, [queryClient]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? (
            <div className="rounded border bg-card p-3 text-sm shadow-xl opacity-90 scale-105 cursor-grabbing w-[280px]">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}