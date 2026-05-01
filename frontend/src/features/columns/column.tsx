import { useState } from 'react';
import { ColumnCardList } from './column-card-list';
import { ColumnHeader } from './column-header';
import { AddCardInput } from '../cards/add-card-input';
import { type Column as ColumnType } from './use-columns';
import type { Card } from '../cards/use-cards';

interface ColumnProps {
  column: ColumnType;
  allColumns?: ColumnType[];
  onDeleted?: () => void;
}

export function Column({ column, allColumns = [], onDeleted }: ColumnProps) {
  const [newCardId, setNewCardId] = useState<number | undefined>();
  const nextColumn = allColumns.find((c) => c.position === column.position + 1);
  const nextColumnId = nextColumn?.id;

  const handleCardCreated = (card: Card) => {
    setNewCardId(card.id);
    setTimeout(() => setNewCardId(undefined), 500);
  };

  return (
    <div className="flex h-full min-w-[320px] max-w-[320px] shrink-0 flex-col rounded-lg" data-column-id={column.id}>
      <ColumnHeader column={column} allColumns={allColumns} onDeleted={onDeleted} />

      <ColumnCardList cards={column.cards || []} newCardId={newCardId} />

      <div className="p-2">
        <AddCardInput columnId={column.id} nextColumnId={nextColumnId} onCardCreated={handleCardCreated} />
      </div>
    </div>
  );
}
