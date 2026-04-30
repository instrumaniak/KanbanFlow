import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBoard } from '../use-boards';
import { useColumns, useCreateColumn } from '../../columns/use-columns';
import { Column } from '../../columns/column';
import { AddColumnButton } from '../../columns/add-column-button';
import { useToast } from '@/components/ui/use-toast';

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const id = boardId ? parseInt(boardId, 10) : 0;

  const { data: boardResponse, isLoading: boardLoading } = useBoard(id);
  const { data: columns, isLoading: columnsLoading } = useColumns(id);

  const board = boardResponse?.data;
  const boardName = boardResponse?.data?.name;
  const boardColor = boardResponse?.data?.background_color;
  const createColumnMutation = useCreateColumn();
  const { toast } = useToast();

  const handleAddColumn = async () => {
    try {
      await createColumnMutation.mutateAsync({ boardId: id, data: {} });
      toast({ title: 'Column added', type: 'success' });
    } catch (err) {
      toast({
        title: 'Failed to add column',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    }
  };

  if (boardLoading || columnsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Board not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className="flex items-center gap-4 border-b px-6 py-4"
        style={{ backgroundColor: boardColor }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-white">{boardName}</h1>
      </div>

      <div className="flex flex-1 overflow-x-auto p-6">
        <div className="flex gap-6">
          {columns?.map((column) => (
            <Column key={column.id} column={column} />
          ))}
          <AddColumnButton onClick={handleAddColumn} />
        </div>
      </div>
    </div>
  );
}