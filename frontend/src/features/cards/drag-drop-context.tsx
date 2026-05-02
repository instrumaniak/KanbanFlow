import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useCallback } from 'react';
import { useMoveCard } from './use-cards';
import { useToast } from '@/components/ui/use-toast';

interface DragData {
  cardId: number;
  sourceColumnId: number;
}

export function DragDropContext({ children }: { children: React.ReactNode }) {
  const moveCardMutation = useMoveCard();
  const { toast } = useToast();

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

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // Optional: track active card for visual feedback
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeData = active.data.current as DragData;
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
    // Optional: cleanup on cancel
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
    </DndContext>
  );
}

export type { DragData };