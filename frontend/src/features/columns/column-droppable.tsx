import { useDroppable } from '@dnd-kit/core';

interface ColumnDroppableProps {
  columnId: number;
  children: (props: {
    isOver: boolean;
    setNodeRef: (node: HTMLElement | null) => void;
  }) => React.ReactNode;
}

export function ColumnDroppable({ columnId, children }: ColumnDroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        outline: isOver ? '2px solid rgba(20, 184, 166, 0.5)' : 'none',
        outlineOffset: '-2px',
        transition: 'outline 150ms ease-in-out',
        position: 'relative',
      }}
    >
      {isOver && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: 'rgba(20, 184, 166, 0.6)',
            top: 0,
            transition: 'all 100ms linear',
          }}
        />
      )}
      {children({ isOver, setNodeRef })}
    </div>
  );
}