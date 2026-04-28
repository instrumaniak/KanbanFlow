import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  useArchivedBoards,
  useRestoreBoard,
  usePermanentDeleteBoard,
  type Board,
} from './use-boards';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ArchivedBoards() {
  const { data: boardsData, isLoading, isError, error, refetch } = useArchivedBoards();
  const restoreMutation = useRestoreBoard();
  const deleteMutation = usePermanentDeleteBoard();
  const { toast } = useToast();

  const boards = boardsData?.data ?? [];

  const handleRestore = useCallback(
    async (board: Board) => {
      try {
        await restoreMutation.mutateAsync(board.id);
        toast({
          title: 'Board restored',
          description: `"${board.name}" has been restored.`,
        });
        refetch();
      } catch (err) {
        toast({
          type: 'destructive',
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to restore board',
        });
      }
    },
    [restoreMutation, toast, refetch]
  );

  const handlePermanentDelete = useCallback(
    async (board: Board) => {
      if (!confirm(`Are you sure you want to permanently delete "${board.name}"? This action cannot be undone.`)) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(board.id);
        toast({
          title: 'Board deleted',
          description: `"${board.name}" has been permanently deleted.`,
        });
        refetch();
      } catch (err) {
        toast({
          type: 'destructive',
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to delete board',
        });
      }
    },
    [deleteMutation, toast, refetch]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">Archived Boards</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">Archived Boards</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="text-sm font-medium">Failed to load archived boards</p>
          <p className="text-sm opacity-80">{error instanceof Error ? error.message : 'Something went wrong'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">Archived Boards</h1>
        <EmptyState
          icon={<Archive className="h-8 w-8 text-muted-foreground" />}
          headline="No archived boards"
          description="Boards you archive will appear here"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-bold">Archived Boards</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {boards.map((board) => (
          <div
            key={board.id}
            className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm"
            style={{ backgroundColor: board.background_color + '20' }}
          >
            <h3 className="mb-3 truncate font-semibold">{board.name}</h3>
            {board.project && (
              <p className="mb-4 text-sm text-muted-foreground">
                Project: {board.project.name}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleRestore(board)}
                disabled={restoreMutation.isPending}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Restore
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handlePermanentDelete(board)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}