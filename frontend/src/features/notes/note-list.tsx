import { useState, useRef, useCallback } from 'react';
import { useNotes } from './use-notes';
import { NoteCard } from './note-card';
import { CreateNoteDialog } from './create-note-dialog';
import { NoteDetail } from './note-detail';
import { NoteEditor } from './note-editor';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, FileText, Plus } from 'lucide-react';
import type { Note } from './notes.api';
import { useDeleteNote } from './use-notes';
import { useToast } from '@/components/ui/use-toast';

const typeFilters = ['All', 'General', 'Board', 'Project', 'Card'] as const;

export function NoteList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<number | undefined>(undefined);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const deleteMutation = useDeleteNote();
  const { toast } = useToast();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const debounceSearch = useCallback((value: string) => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setTagFilter(undefined);
    }, 300);
  }, []);

  const filters = {
    search: debouncedSearch || undefined,
    type: typeFilter !== 'All' ? typeFilter.toLowerCase() as never : undefined,
    tagId: tagFilter,
  };

  const clearTagFilter = () => {
    setTagFilter(undefined);
  };

  const handleTagClick = (tagId: number) => {
    setTagFilter((prev) => (prev === tagId ? undefined : tagId));
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    clearTagFilter();
  };



  const { data, isLoading } = useNotes(filters);
  const notes = data?.data ?? [];

  const handleDelete = () => {
    if (!deletingNote) return;
    const noteId = deletingNote.id;
    const noteTitle = deletingNote.title;
    setDeletingNote(null);

    deleteTimerRef.current = setTimeout(() => {
      deleteMutation.mutate(
        { id: noteId },
        {
          onSuccess: () => {
            toast({ title: 'Note deleted' });
          },
          onError: () => {
            toast({ title: 'Failed to delete note', type: 'destructive' });
          },
        },
      );
    }, 5000);

    toast({
      title: `"${noteTitle}" will be deleted`,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(deleteTimerRef.current);
          toast({ title: 'Delete undone' });
        },
      },
    });
  };

  if (selectedNote) {
    return (
      <NoteDetail
        note={selectedNote}
        onBack={() => setSelectedNote(null)}
        onEdit={() => {
          setEditingNote(selectedNote);
          setSelectedNote(null);
        }}
        onDelete={() => {
          setDeletingNote(selectedNote);
          setSelectedNote(null);
        }}
      />
    );
  }

  if (editingNote) {
    return (
      <div className="p-4">
        <NoteEditor
          note={editingNote}
          onSave={() => {
            setEditingNote(null);
          }}
          onCancel={() => setEditingNote(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <CreateNoteDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
          >
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
          </CreateNoteDialog>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debounceSearch(e.target.value);
            }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none sticky top-0 bg-background z-10 pb-1">
          {typeFilters.map((type) => (
            <Badge
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap text-xs"
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1 px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No notes yet. Create your first note to start documenting.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setSelectedNote(note)}
                onEdit={() => setEditingNote(note)}
                onDelete={() => setDeletingNote(note)}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      <AlertDialog
        open={!!deletingNote}
        onOpenChange={(open) => !open && setDeletingNote(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingNote?.title}" and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
