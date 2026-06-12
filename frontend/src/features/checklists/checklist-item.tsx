import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateChecklistItem, useDeleteChecklistItem } from './use-checklists';
import { ChecklistItem as ChecklistItemType } from './checklists.api';
import { useToast } from '@/components/ui/use-toast';

interface ChecklistItemProps {
  item: ChecklistItemType;
}

export function ChecklistItem({ item }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const updateMutation = useUpdateChecklistItem();
  const deleteMutation = useDeleteChecklistItem();

  const handleToggle = (checked: boolean) => {
    updateMutation.mutate({
      itemId: item.id,
      data: { is_completed: checked },
    });
  };

  const handleSave = () => {
    if (text.trim() === '') {
      setText(item.text);
      setIsEditing(false);
      return;
    }
    if (text.trim() !== item.text.trim()) {
      updateMutation.mutate(
        {
          itemId: item.id,
          data: { text: text.trim() },
        },
        {
          onError: () => {
            setText(item.text);
            toast({ title: 'Failed to save item text', type: 'destructive' });
          },
        },
      );
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setText(item.text);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    const previousItem = { ...item };
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        toast({
          title: 'Item deleted',
          duration: 5000,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateMutation.mutate(
                  {
                    itemId: previousItem.id,
                    data: { text: previousItem.text, is_completed: previousItem.is_completed },
                  },
                  {
                    onSettled: () => {
                      queryClient.invalidateQueries({ queryKey: ['cards'] });
                    },
                  },
                );
              }}
            >
              Undo
            </Button>
          ),
        });
      },
    });
  };

  return (
    <div className="flex items-center gap-2 group py-1">
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={handleToggle}
        className="flex-shrink-0"
      />
      {isEditing ? (
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm flex-1"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer ${
            item.is_completed ? 'line-through text-muted-foreground' : ''
          }`}
          onClick={() => {
            setText(item.text);
            setIsEditing(true);
          }}
        >
          {item.text}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 h-6 w-6 p-0"
        onClick={handleDelete}
      >
        <span className="sr-only">Delete</span>
        <span className="text-muted-foreground">×</span>
      </Button>
    </div>
  );
}
