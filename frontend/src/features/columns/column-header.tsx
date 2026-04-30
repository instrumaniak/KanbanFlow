import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateColumn, useDeleteColumn, type Column } from './use-columns';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ColumnHeaderProps {
  column: Column;
  onDeleted?: () => void;
}

export function ColumnHeader({ column, onDeleted }: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateColumn();
  const deleteMutation = useDeleteColumn();
  const { toast } = useToast();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(column.name);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === column.name) {
      setIsEditing(false);
      setEditValue(column.name);
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: column.id, data: { name: trimmed } });
      toast({ title: 'Column renamed', type: 'success' });
      setIsEditing(false);
    } catch (err) {
      toast({
        title: 'Failed to rename column',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
      setEditValue(column.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(column.name);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(column.id);
      setShowDeleteDialog(false);
      toast({ title: 'Column deleted', type: 'success' });
      onDeleted?.();
    } catch (err) {
      toast({
        title: 'Failed to delete column',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    }
  };

  return (
    <div className="flex items-center justify-between border-b px-3 py-2">
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-semibold"
        />
      ) : (
        <button
          onClick={handleStartEdit}
          className="flex-1 truncate text-left text-sm font-semibold hover:bg-muted/50 rounded px-2 py-1"
        >
          {column.name}
        </button>
      )}

      <div className="relative">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border bg-popover p-1 shadow-md">
            <button
              onClick={handleStartEdit}
              className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              Rename
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowDeleteDialog(true);
              }}
              className="flex w-full items-center rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete column?</DialogTitle>
            <DialogDescription>
              All cards in this column will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}