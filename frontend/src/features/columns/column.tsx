import { ColumnCardList } from './column-card-list';
import { ColumnHeader } from './column-header';
import { type Column as ColumnType } from './use-columns';

interface ColumnProps {
  column: ColumnType;
  allColumns?: ColumnType[];
  onDeleted?: () => void;
}

export function Column({ column, allColumns = [], onDeleted }: ColumnProps) {
  return (
    <div className="flex h-full min-w-[320px] max-w-[320px] shrink-0 flex-col rounded-lg">
      <ColumnHeader column={column} allColumns={allColumns} onDeleted={onDeleted} />

      <ColumnCardList cards={column.cards || []} />

      <div className="border-t p-2">
        <button className="flex w-full items-center rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent">
          + Add a card
        </button>
      </div>
    </div>
  );
}
