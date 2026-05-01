import { ColumnCardList } from './column-card-list';
import { ColumnHeader } from './column-header';
import { AddCardInput } from '../cards/add-card-input';
import { type Column as ColumnType } from './use-columns';

interface ColumnProps {
  column: ColumnType;
  allColumns?: ColumnType[];
  onDeleted?: () => void;
}

export function Column({ column, allColumns = [], onDeleted }: ColumnProps) {
  const nextColumn = allColumns.find((c) => c.position === column.position + 1);
  const nextColumnId = nextColumn?.id;

  return (
    <div className="flex h-full min-w-[320px] max-w-[320px] shrink-0 flex-col rounded-lg" data-column-id={column.id}>
      <ColumnHeader column={column} allColumns={allColumns} onDeleted={onDeleted} />

      <ColumnCardList cards={column.cards || []} />

      <div className="border-t p-2">
        <AddCardInput columnId={column.id} nextColumnId={nextColumnId} />
      </div>
    </div>
  );
}
