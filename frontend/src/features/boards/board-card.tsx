import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUpdateBoard, useDeleteBoard, type Board } from './use-boards';
import { Pencil, Trash2, Layout } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BoardCardProps {
  board: Board;
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="group relative flex h-28 cursor-pointer flex-col justify-between rounded-lg p-4 text-white transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: board.background_color }}
      onClick={() => navigate(`/board/${board.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 truncate font-semibold">{board.name}</div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(board.id, board.name);
            }}
            aria-label={`Edit board ${board.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(board.id, board.name);
            }}
            aria-label={`Delete board ${board.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {board.project && (
        <div className="text-xs text-white/70">{board.project.name}</div>
      )}
      <Layout className="absolute bottom-2 right-2 h-6 w-6 opacity-30" />
    </div>
  );
}

export function InlineEditForm({
  initialValue,
  boardId,
  backgroundColor,
  projectId,
  projects,
  onSave,
  onCancel,
}: {
  initialValue: string;
  boardId: number;
  backgroundColor: string;
  projectId: number | null;
  projects: Array<{ id: number; name: string }>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialValue);
  const [selectedColor, setSelectedColor] = useState(backgroundColor);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(projectId);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateBoard();
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = async () => {
    if (updateMutation.isPending) return;

    const trimmed = name.trim();
    if (!trimmed || (trimmed === initialValue && selectedColor === backgroundColor && selectedProjectId === projectId)) {
      onCancel();
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: boardId,
        data: {
          name: trimmed !== initialValue ? trimmed : undefined,
          background_color: selectedColor !== backgroundColor ? selectedColor : undefined,
          project_id: selectedProjectId !== projectId ? selectedProjectId : undefined,
        },
      });
      toast({ title: 'Board updated', type: 'success' });
      onSave();
    } catch (err) {
      toast({
        title: 'Failed to update board',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const PRESET_COLORS = [
    '#0079BF', '#D29034', '#519839', '#B61C26',
    '#F5D6CC', '#C0B6F2', '#FFAB00', '#838C91',
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          aria-label="Board name"
          className="font-semibold"
          disabled={updateMutation.isPending}
        />
      </div>

      <div className="mb-3">
        <label className="text-sm font-medium">Background</label>
        <div className="mt-1 flex gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`h-6 w-6 rounded border transition-all ${
                selectedColor === color
                  ? 'border-foreground scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Project</label>
        <select
          value={selectedProjectId ?? ''}
          onChange={(e) =>
            setSelectedProjectId(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DeleteDialog({
  boardName,
  boardId,
  open,
  onOpenChange,
  onDeleted,
}: {
  boardName: string;
  boardId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const deleteMutation = useDeleteBoard();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(boardId);
      onOpenChange(false);
      onDeleted();
      toast({
        title: 'Board deleted',
        type: 'destructive',
        action: {
          label: 'Undo',
          onClick: async () => {
            toast({ title: 'Undo not available', type: 'error' });
          },
        },
      });
    } catch (err) {
      toast({
        title: 'Failed to delete board',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete board</DialogTitle>
          <DialogDescription>
            Delete board &quot;{boardName}&quot;? This will delete all columns and cards within it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}