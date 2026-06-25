import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note } from './notes.api';
import { useCreateNote, useUpdateNote } from './use-notes';
import { TagPicker } from '@/features/tags/tag-picker';
import { NoteLinkSelector } from './note-link-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Bold, Italic, Heading, Code, List, Eye, EyeOff } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';

interface NoteEditorProps {
  note?: Note;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  defaultBoardId?: number;
}

export function NoteEditor({ note, onSave, onCancel, onDelete, defaultBoardId }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    note?.tags?.map((t) => t.id) ?? [],
  );
  const [linkBoardId, setLinkBoardId] = useState<number | undefined>(
    defaultBoardId ?? note?.board_id ?? undefined,
  );
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback((before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) + before + selected + after + content.substring(end);
    setContent(newContent);
    setDirty(true);
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length;
      textarea.setSelectionRange(
        selected ? cursorPos + selected.length : cursorPos,
        selected ? cursorPos + selected.length : cursorPos,
      );
    }, 0);
  }, [content]);

  const autoSave = useCallback(() => {
    if (!dirty || !note) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (!title.trim()) return;
      updateMutation.mutate(
        {
          id: note.id,
          data: {
            title: title.trim(),
            content,
            tagIds: selectedTagIds,
            ...(linkBoardId ? { board_id: linkBoardId } : {}),
          },
        },
        {
          onError: () => {
            toast({ title: 'Failed to auto-save', type: 'destructive' });
          },
        },
      );
      setDirty(false);
    }, 2000);
  }, [dirty, note, title, content, selectedTagIds, linkBoardId, updateMutation, toast]);

  useEffect(() => {
    if (note) {
      autoSave();
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [title, content, selectedTagIds, note, autoSave]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', type: 'destructive' });
      return;
    }

    const commonData: Record<string, unknown> = {
      title: title.trim(),
      content,
      tagIds: selectedTagIds,
    };
    if (linkBoardId) {
      commonData.board_id = linkBoardId;
    }

    if (note) {
      updateMutation.mutate(
        { id: note.id, data: commonData },
        {
          onSuccess: () => {
            toast({ title: 'Note saved' });
            setDirty(false);
            onSave();
          },
          onError: (error) => {
            toast({ title: 'Failed to save note', description: error.message, type: 'destructive' });
          },
        },
      );
    } else {
      createMutation.mutate(commonData, {
        onSuccess: () => {
          toast({ title: 'Note created' });
          setDirty(false);
          onSave();
        },
        onError: (error) => {
          toast({ title: 'Failed to create note', description: error.message, type: 'destructive' });
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{note ? 'Edit Note' : 'New Note'}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview(!preview)}
          >
            {preview ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            {preview ? 'Edit' : 'Preview'}
          </Button>
          {note && onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        onKeyDown={handleKeyDown}
        className="text-lg font-medium"
      />

      {!preview ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1 sticky top-0 bg-background z-10 pb-1 border-b">
            <ToolbarButton icon={<Bold className="h-3.5 w-3.5" />} label="Bold" onClick={() => insertMarkdown('**', '**')} />
            <ToolbarButton icon={<Italic className="h-3.5 w-3.5" />} label="Italic" onClick={() => insertMarkdown('_', '_')} />
            <ToolbarButton icon={<Heading className="h-3.5 w-3.5" />} label="Heading" onClick={() => insertMarkdown('### ', '')} />
            <ToolbarButton icon={<Code className="h-3.5 w-3.5" />} label="Code" onClick={() => insertMarkdown('`', '`')} />
            <ToolbarButton icon={<List className="h-3.5 w-3.5" />} label="List" onClick={() => insertMarkdown('- ', '')} />
          </div>
          <textarea
            ref={textareaRef}
            placeholder="Write your note content in markdown..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setDirty(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y font-mono"
          />
        </div>
      ) : (
        <div className="min-h-[300px] rounded-md border border-input bg-card px-3 py-2 text-sm overflow-auto prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={content} />
        </div>
      )}

      <NoteLinkSelector
        linkBoardId={linkBoardId}
        onLinkBoard={(id) => {
          setLinkBoardId(id);
          setDirty(true);
        }}
      />

      <Separator />

      <div>
        <label className="text-sm font-medium mb-1 block">Tags</label>
        <TagPicker
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handleSave}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0"
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
